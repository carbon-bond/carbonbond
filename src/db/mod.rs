use diesel::pg::PgConnection;
use diesel::prelude::*;

pub mod models;
pub mod schema;

pub fn connect_db(url: &str) -> PgConnection {
    PgConnection::establish(url).expect(&format!("連線至 {} 時發生錯誤", url))
}
