#[macro_use]
extern crate derive_more;

pub mod config;
pub mod custom_error;

#[cfg(not(feature = "prepare"))]
pub mod api;
#[cfg(not(feature = "prepare"))]
pub mod db;
#[cfg(not(feature = "prepare"))]
pub mod email;
#[cfg(not(feature = "prepare"))]
pub mod redis;
#[cfg(not(feature = "prepare"))]
pub mod routes;
#[cfg(not(feature = "prepare"))]
pub mod service;
#[cfg(not(feature = "prepare"))]
pub mod util;

#[cfg(not(feature = "prepare"))]
mod product {
    pub const MAX_ARTICLE_FIELD: usize = 15;

    use crate::custom_error::{ErrorCode, Fallible};

    use async_trait::async_trait;
    use cookie::Cookie;
    use hyper::header;
    use hyper::header::HeaderValue;
    use hyper::{HeaderMap, Response};
    use redis::AsyncCommands;
    use std::str::FromStr;

    #[async_trait]
    pub trait Context {
        async fn remember_id(&mut self, id: i64) -> Fallible<()>;
        async fn forget_id(&mut self) -> Fallible<()>;
        async fn get_id(&mut self) -> Option<i64>;
        async fn get_id_strict(&mut self) -> Fallible<i64> {
            self.get_id()
                .await
                .ok_or_else(|| ErrorCode::NeedLogin.into())
        }
    }

    pub struct Ctx {
        pub headers: HeaderMap<HeaderValue>,
        pub resp: Response<String>,
    }

    // XXX: 明碼傳輸，先頂着用，上線前必須處理安全問題
    impl Ctx {
        fn set_session<T: ToString>(&mut self, key: &str, value: T) -> Fallible<()> {
            self.resp.headers_mut().insert(
                header::SET_COOKIE,
                HeaderValue::from_str(
                    &Cookie::build(key, &value.to_string()).finish().to_string(),
                )?,
            );
            Ok(())
        }
        fn get_session<T: FromStr>(&mut self, key: &str) -> Option<T> {
            self.headers
                .get(header::COOKIE)
                .and_then(|v| v.to_str().ok())
                .and_then(|s| {
                    for kv in s.split(' ') {
                        if let Ok(cookie) = Cookie::parse(kv) {
                            let (k, v) = cookie.name_value();
                            if k == key {
                                return v.parse::<T>().ok();
                            }
                        }
                    }
                    None
                })
        }
        fn forget_session(&mut self, key: &str) -> Fallible<()> {
            use time::OffsetDateTime;
            self.resp.headers_mut().insert(
                header::SET_COOKIE,
                HeaderValue::from_str(
                    &Cookie::build(key, "")
                        .expires(OffsetDateTime::now_utc())
                        .finish()
                        .to_string(),
                )?,
            );
            Ok(())
        }
    }
    fn gen_token() -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let random_u8: [u8; 32] = rng.gen();
        base64::encode(&random_u8)
    }
    #[async_trait]
    impl Context for Ctx {
        async fn remember_id(&mut self, id: i64) -> Fallible<()> {
            let mut conn = crate::redis::get_conn().await?;
            let token = gen_token();
            // NOTE: 不知道第三個泛型參數什麼作用
            conn.set::<&str, i64, ()>(&token, id).await?;
            // TODO: 設置到 config.toml
            conn.expire(&token, 60 * 60 * 24 * 7).await?;
            self.set_session("token", token)
        }

        async fn forget_id(&mut self) -> Fallible<()> {
            self.forget_session("token")
        }

        async fn get_id(&mut self) -> Option<i64> {
            match self.get_session::<String>("token") {
                Some(ref token) => match crate::redis::get_conn().await {
                    Ok(mut conn) => match conn.get::<&str, i64>(token).await.ok() {
                        Some(id) => {
                            conn.expire::<&str, ()>(token, 60 * 60 * 24 * 7).await;
                            Some(id)
                        }
                        None => {
                            self.forget_session("token");
                            None
                        }
                    },
                    Err(_) => None,
                },
                None => None,
            }
        }
    }
}
#[cfg(not(feature = "prepare"))]
pub use product::*;
