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
use std::sync::{Arc, Mutex};
use diesel::pg::PgConnection;

struct Ctx {
    session: Session,
    conn: Arc<Mutex<PgConnection>>,
}
