pub mod api;
pub mod custom_error;
pub mod user;
pub mod forum;
pub mod db;
pub mod party;
pub mod config;

pub const MAX_ARTICLE_COLUMN: usize = 15;

#[macro_use]
extern crate diesel;
#[macro_use]
extern crate failure;

extern crate serde_json;
extern crate regex;
extern crate state;

use std::sync::{Arc, Mutex, MutexGuard};
use actix_session::{Session};
use diesel::pg::PgConnection;
use crate::custom_error::{Error, Fallible};

pub trait Context {
    fn use_pg_conn<T, F: FnOnce(&PgConnection) -> T>(&self, callback: F) -> T;
    fn remember_id(&self, id: String) -> Fallible<()>;
    fn forget_id(&self) -> Fallible<()>;
    fn get_id(&self) -> Option<String>;
}

pub struct Ctx {
    session: Session,
    conn: Arc<Mutex<PgConnection>>,
}
impl Ctx {
    pub fn get_pg_conn(&self) -> MutexGuard<PgConnection> {
        self.conn.lock().unwrap()
    }
}
impl Context for Ctx {
    fn use_pg_conn<T, F>(&self, callback: F) -> T
    where
        F: FnOnce(&PgConnection) -> T,
    {
        let conn = &*self.conn.lock().unwrap();
        callback(conn)
    }
    fn remember_id(&self, id: String) -> Fallible<()> {
        if self.session.set::<String>("id", id.to_string()).is_err() {
            Err(Error::new_internal("記憶 ID 失敗"))
        } else {
            Ok(())
        }
    }
    fn forget_id(&self) -> Fallible<()> {
        if self.session.set::<String>("id", "".to_string()).is_err() {
            Err(Error::new_internal("清除 ID 失敗").into())
        } else {
            Ok(())
        }
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
