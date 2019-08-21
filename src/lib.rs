pub mod api;
pub mod custom_error;
pub mod user;
pub mod forum;
pub mod db;
pub mod party;
pub mod config;

pub const MAX_ARTICLE_COLUMN: usize = 15;

extern crate juniper;
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate derive_more;
extern crate r2d2;
extern crate serde_json;
extern crate regex;
extern crate state;

use actix_session::{Session};
use diesel::pg::PgConnection;
use crate::custom_error::{Error, Fallible};

pub trait Context {
    fn use_pg_conn<T, F>(&self, callback: F) -> Fallible<T>
    where
        F: FnOnce(PgConnection) -> Fallible<T>;
    fn remember_id(&self, id: String) -> Fallible<()>;
    fn forget_id(&self) -> Fallible<()>;
    fn get_id(&self) -> Option<String>;
}

pub struct Ctx {
    session: Session,
}
impl Ctx {
    pub fn get_pg_conn(&self) -> Fallible<PgConnection> {
        db::connect_db()
    }
}
impl Context for Ctx {
    fn use_pg_conn<T, F>(&self, callback: F) -> Fallible<T>
    where
        F: FnOnce(PgConnection) -> Fallible<T>,
    {
        let conn = db::connect_db()?;
        let result = callback(conn)?;
        Ok(result)
    }
    fn remember_id(&self, id: String) -> Fallible<()> {
        self.session
            .set::<String>("id", id)
            .map_err(|_| Error::new_internal_without_source("記憶 ID 失敗"))
    }
    fn forget_id(&self) -> Fallible<()> {
        self.session
            .set::<String>("id", "".to_owned())
            .map_err(|_| Error::new_internal_without_source("清除 ID 失敗"))
    }
    fn get_id(&self) -> Option<String> {
        let id = match self.session.get::<String>("id") {
            Err(_) => return None,
            Ok(id) => id,
        };
        if id.is_none() {
            None
        } else {
            let id = id.unwrap();
            if id == "" {
                None
            } else {
                Some(id)
            }
        }
    }
}
