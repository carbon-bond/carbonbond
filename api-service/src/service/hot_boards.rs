use crate::custom_error::Fallible;
use crate::redis::hot_boards;

pub async fn add_hot_board_point(board_id: i64, article_id: i64) -> Fallible {
    hot_boards::add_hot_board_point(board_id, article_id).await
}
pub async fn get_hot_boards() -> Fallible<Vec<i64>> {
    hot_boards::get_hot_boards().await
}
