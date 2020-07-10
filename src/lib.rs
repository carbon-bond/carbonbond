#[macro_use]
extern crate derive_more;

pub mod api;
pub mod config;
pub mod custom_error;

pub const MAX_ARTICLE_FIELD: usize = 15;

use crate::custom_error::Fallible;

use cookie::Cookie;
use hyper::header;
use hyper::header::HeaderValue;
use hyper::{Body, HeaderMap, Response};

pub trait Context {
    fn remember_id(&mut self, id: i64) -> Fallible<()>;
    fn forget_id(&mut self) -> Fallible<()>;
    fn get_id(&mut self) -> Option<i64>;
}

pub struct Ctx {
    pub headers: HeaderMap<HeaderValue>,
    pub resp: Response<String>,
}

impl Ctx {}
impl Context for Ctx {
    fn remember_id(&mut self, id: i64) -> Fallible<()> {
        self.resp.headers_mut().insert(
            header::SET_COOKIE,
            HeaderValue::from_str(&Cookie::build("id", id.to_string()).finish().to_string())?,
        );
        Ok(())
    }

    fn forget_id(&mut self) -> Fallible<()> {
        use time::OffsetDateTime;
        self.resp.headers_mut().insert(
            header::SET_COOKIE,
            HeaderValue::from_str(
                &Cookie::build("id", "")
                    .expires(OffsetDateTime::now_utc())
                    .finish()
                    .to_string(),
            )?,
        );
        Ok(())
    }

    fn get_id(&mut self) -> Option<i64> {
        self.headers
            .get(header::COOKIE)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| {
                log::info!("cookie: {}", s);
                for kv in s.split(' ') {
                    if let Ok(cookie) = Cookie::parse(kv) {
                        let (key, value) = cookie.name_value();
                        if key == "id" {
                            return value.parse::<i64>().ok();
                        }
                    }
                }
                None
            })
    }
}
