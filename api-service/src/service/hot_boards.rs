use crate::custom_error::{Contextable, Fallible};
use crate::redis::{board_pop, hot_boards};
use std::time::Duration;
use tokio::time::interval;

const INTERVAL: u64 = 10;
const MAX_HOT_BOARDS: usize = 100;

pub async fn start() -> Fallible {
    let mut interval = interval(Duration::from_secs(INTERVAL));
    loop {
        interval.tick().await;
        compute_hot_boards().await?;
    }
}

async fn compute_hot_boards() -> Fallible {
    // log::info!("開始計算熱門看板");
    let boards = board_pop::get_all_board_pop()
        .await
        .context("取看板人氣失敗")?;
    let mut boards: Vec<_> = boards.into_iter().collect();
    boards.sort_by_key(|(_, pop)| -(*pop as i64));
    let boards: Vec<_> = boards
        .into_iter()
        .take(MAX_HOT_BOARDS)
        .map(|(id, _)| id)
        .collect();
    // log::debug!("熱門看板結果：{:?}", boards);
    hot_boards::set_hot_boards(&boards)
        .await
        .context("設定熱門看板失敗")?;
    Ok(())
}

pub async fn set_board_pop(user_id: i64, board_id: i64) -> Fallible {
    board_pop::set_board_pop(user_id, board_id).await
}
pub async fn get_hot_boards() -> Fallible<Vec<i64>> {
    hot_boards::get_hot_boards().await
}
