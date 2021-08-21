use crate::config;
use crate::custom_error::Fallible;
use redis::{aio::Connection, Client};
use state::Storage;

static CLIENT: Storage<Client> = Storage::new();

pub async fn init() -> Fallible<()> {
    let conf = config::get_config();
    let client = Client::open(&*conf.redis.host)?;
    assert!(CLIENT.set(client), "Redis 客戶端被重複創建");
    Ok(())
}
pub async fn get_conn() -> Fallible<Connection> {
    let conn = CLIENT.get().get_async_connection().await?;
    Ok(conn)
}

pub mod board_pop;
pub mod hot_articles;
pub mod hot_boards;
