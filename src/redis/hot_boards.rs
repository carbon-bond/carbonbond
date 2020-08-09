use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;

const KEY: &'static str = "hot_boards";

pub async fn set_hot_boards(boards: &[i64]) -> Fallible {
    log::trace!("設定熱門看板");
    let mut conn = get_conn().await?;
    conn.del(KEY).await?;
    conn.rpush(KEY, boards).await?;
    Ok(())
}
pub async fn get_hot_boards() -> Fallible<Vec<i64>> {
    log::trace!("查詢熱門看板");
    let mut conn = get_conn().await?;
    let hot_boards = conn.lrange(KEY, 0, -1).await?;
    Ok(hot_boards)
}
