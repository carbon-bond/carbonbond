pub const MAX_ARTICLE_FIELD: usize = 15;

use crate::chat;
use crate::config::get_config;
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
    async fn get_id(&mut self) -> Fallible<Option<i64>>;
    async fn get_id_strict(&mut self) -> Fallible<i64> {
        self.get_id()
            .await?
            .ok_or_else(|| ErrorCode::NeedLogin.into())
    }
}

pub struct Ctx {
    pub headers: HeaderMap<HeaderValue>,
    pub resp: Response<String>,
    pub users: chat::control::Users,
}

impl Ctx {
    fn set_session<T: ToString>(&mut self, key: &str, value: T) -> Fallible<()> {
        self.resp.headers_mut().insert(
            header::SET_COOKIE,
            HeaderValue::from_str(
                &Cookie::build(key, &value.to_string())
                    .max_age(time::Duration::days(360 * 1000)) // 由後端控制 session 期限（redis expire），前端就儲存一千年吧
                    .finish()
                    .to_string(),
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
        self.resp.headers_mut().insert(
            header::SET_COOKIE,
            HeaderValue::from_str(
                &Cookie::build(key, "")
                    .max_age(time::Duration::zero())
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
// 爲 redis 的鍵添加名稱空間
fn redis_login_token_key(token: &String) -> String {
    format!("login_token::{}", token)
}
#[async_trait]
impl Context for Ctx {
    async fn remember_id(&mut self, id: i64) -> Fallible<()> {
        let mut conn = crate::redis::get_conn().await?;
        let token = gen_token();
        let key = redis_login_token_key(&token);
        // NOTE: 不知道第三個泛型參數什麼作用
        conn.set::<&str, i64, ()>(&key, id).await?;
        conn.expire(&key, get_config().account.session_expire_seconds)
            .await?;
        self.set_session("token", token)
    }

    async fn forget_id(&mut self) -> Fallible<()> {
        match self.get_session::<String>("token") {
            Some(ref token) => {
                let mut conn = crate::redis::get_conn().await?;
                let key = redis_login_token_key(token);
                conn.del(&key).await?;
            }
            None => {}
        }
        self.forget_session("token")
    }

    async fn get_id(&mut self) -> Fallible<Option<i64>> {
        match self.get_session::<String>("token") {
            Some(ref token) => match crate::redis::get_conn().await {
                Ok(mut conn) => {
                    let key = redis_login_token_key(token);
                    match conn.get::<&str, i64>(&key).await.ok() {
                        Some(id) => {
                            conn.expire::<&str, ()>(
                                &key,
                                get_config().account.session_expire_seconds,
                            )
                            .await?; // 後端續 redis 過期時間
                            Ok(Some(id))
                        }
                        None => {
                            self.forget_session("token")?;
                            Ok(None)
                        }
                    }
                }
                Err(_) => Ok(None),
            },
            None => Ok(None),
        }
    }
}
