use diesel::pg::PgConnection;
use diesel::prelude::*;
use dotenv::dotenv;
use std::env;

pub mod models;
pub mod schema;

pub fn connect_db() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("未設定資料庫位址");
    PgConnection::establish(&database_url).expect(&format!("連線至 {} 時發生錯誤", database_url))
}
