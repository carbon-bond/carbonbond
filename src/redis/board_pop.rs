use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;
use std::collections::HashMap;

const BOARD_KEY: &'static str = "boards";

pub async fn set_board_pop(user_id: i64, board_id: i64) -> Fallible {
    log::trace!("新增人氣記錄：user={}, board={}", user_id, board_id);
    let mut conn = get_conn().await?;
    if conn.exists(user_id).await? {
        let old_board_id: i64 = conn.get(user_id).await?;
        log::trace!("減去舊的人氣記錄：user={}, board={}", user_id, old_board_id);
        conn.hincr(BOARD_KEY, old_board_id, -1).await?;
    }
    conn.set(user_id, board_id).await?;
    conn.hincr(BOARD_KEY, board_id, 1).await?;
    Ok(())
}

pub async fn get_board_pop(board_id: i64) -> Fallible<i64> {
    log::trace!("查詢 #{} 看板人氣", board_id);
    let mut conn = get_conn().await?;
    let pop: i64 = conn.hget(BOARD_KEY, board_id).await.unwrap_or(0);
    Ok(pop)
}

pub async fn get_all_board_pop() -> Fallible<HashMap<i64, i64>> {
    log::trace!("查詢全看板人氣");
    let mut conn = get_conn().await?;
    let map = conn.hgetall(BOARD_KEY).await.unwrap_or_default();
    Ok(map)
}
