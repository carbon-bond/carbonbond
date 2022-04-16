use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;
use std::collections::HashMap;

const KEY_BOARD_HOT_POINT: &'static str = "board_article_number_in_24h";

pub async fn get_board_pop(board_id: i64) -> Fallible<i64> {
    log::trace!("查詢 #{} 看板人氣", board_id);
    let mut conn = get_conn().await?;
    let pop: i64 = conn.zscore(KEY_BOARD_HOT_POINT, board_id).await.unwrap_or(0);
    Ok(pop)
}

pub async fn get_all_board_pop() -> Fallible<HashMap<i64, i64>> {
    log::trace!("查詢全看板人氣");
    let mut conn = get_conn().await?;
    let map = conn.hgetall(KEY_BOARD_HOT_POINT).await.unwrap_or_default();
    Ok(map)
}
