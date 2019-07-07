pub mod api;
pub mod custom_error;
pub mod user;
pub mod forum;
pub mod db;
pub mod party;

#[macro_use]
extern crate diesel;
extern crate serde_json;
#[macro_use]
extern crate failure;

use actix_session::{Session};
use std::sync::{Arc, Mutex, MutexGuard};
use diesel::pg::PgConnection;
use custom_error::Error;

pub trait Context {
    fn use_pg_conn<T, F: FnMut(&PgConnection) -> T>(&self, callback: F) -> T;
    fn remember_id(&self, id: String) -> Result<(), Error>;
    fn forget_id(&self) -> Result<(), Error>;
    fn get_id(&self) -> Result<Option<String>, Error>;
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
    fn use_pg_conn<T, F>(&self, mut callback: F) -> T
    where
        F: FnMut(&PgConnection) -> T,
    {
        let conn = &*self.conn.lock().unwrap();
        callback(conn)
    }
    fn remember_id(&self, id: String) -> Result<(), Error> {
        if self.session.set::<String>("id", id.to_string()).is_err() {
            Err(Error::InternalError)
        } else {
            Ok(())
        }
    }
    fn forget_id(&self) -> Result<(), Error> {
        if self.session.set::<String>("id", "".to_string()).is_err() {
            Err(Error::InternalError)
        } else {
            Ok(())
        }
    }
    fn get_id(&self) -> Result<Option<String>, Error> {
        let id = match self.session.get::<String>("id") {
            Err(_) => return Err(Error::InternalError),
            Ok(id) => id,
        };
        if id.is_none() {
            Ok(None)
        } else {
            let id = id.unwrap();
            if id == "" {
                Ok(None)
            } else {
                Ok(Some(id))
            }
        }
    }
}
