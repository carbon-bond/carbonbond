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

pub struct Ctx {
    session: Session,
    conn: Arc<Mutex<PgConnection>>,
}
use actix_web::Error;
impl Ctx {
    pub fn get_pg_conn(&self) -> MutexGuard<PgConnection> {
        self.conn.lock().unwrap()
    }
    pub fn use_pg_conn<F>(&self, mut callback: F)
    where
        F: FnMut(&PgConnection),
    {
        let conn = &*self.conn.lock().unwrap();
        callback(conn);
    }
    pub fn add_id_to_session(&self, id: String) -> Result<(), Error> {
        self.session.set::<String>("id", id.to_string())
    }
    pub fn clear_id_from_session(&self) -> Result<(), Error> {
        self.session.set::<String>("id", "".to_string())
    }
    pub fn get_id(&self) -> Result<Option<String>, Error> {
        let id = self.session.get::<String>("id")?;
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
