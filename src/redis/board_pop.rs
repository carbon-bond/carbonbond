use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;

fn gen_key(board_id: i64) -> String {
    format!("{{board}}{}", board_id)
}

pub async fn set_user_board(user_id: i64, board_id: i64) -> Fallible {
    log::trace!("新增人氣記錄：user={}, board={}", user_id, board_id);
    let mut conn = get_conn().await?;
    if conn.exists(user_id).await? {
        let old_board_id: i64 = conn.get(user_id).await?;
        log::trace!("減去舊的人氣記錄：user={}, board={}", user_id, old_board_id);
        conn.incr(gen_key(old_board_id), -1).await?;
    }
    conn.set(user_id, board_id).await?;
    conn.incr(gen_key(board_id), 1).await?;
    Ok(())
}

pub async fn get_board_pop(board_id: i64) -> Fallible<u64> {
    log::trace!("查詢 #{} 看板人氣", board_id);
    let mut conn = get_conn().await?;
    let pop = conn.get(gen_key(board_id)).await?;
    Ok(pop)
}
