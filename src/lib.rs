#[macro_use]
extern crate derive_more;

pub mod config;
pub mod custom_error;

#[cfg(not(feature = "prepare"))]
pub mod api;
#[cfg(not(feature = "prepare"))]
pub mod db;

#[cfg(not(feature = "prepare"))]
mod product {
    pub const MAX_ARTICLE_FIELD: usize = 15;

    use crate::custom_error::Fallible;

    use cookie::Cookie;
    use hyper::header;
    use hyper::header::HeaderValue;
    use hyper::{HeaderMap, Response};
    use std::str::FromStr;

    pub trait Context {
        fn remember_id(&mut self, id: i64) -> Fallible<()>;
        fn forget_id(&mut self) -> Fallible<()>;
        fn get_id(&mut self) -> Option<i64>;
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
    impl Ctx {}
    impl Context for Ctx {
        fn remember_id(&mut self, id: i64) -> Fallible<()> {
            self.set_session("id", id)
        }

        fn forget_id(&mut self) -> Fallible<()> {
            self.forget_session("id")
        }

        fn get_id(&mut self) -> Option<i64> {
            self.get_session("id")
        }
    }
}
#[cfg(not(feature = "prepare"))]
pub use product::*;
