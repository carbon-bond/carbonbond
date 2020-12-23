use super::{get_pool, DBObject};
use crate::api::model::BoardOverview;
use crate::custom_error::{DataType, ErrorCode, Fallible};

impl DBObject for BoardOverview {
    const TYPE: DataType = DataType::Board;
}

pub async fn unsubscribe(user_id: i64, board_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "DELETE FROM subscribed_boards WHERE user_id = $1 AND board_id = $2",
        user_id,
        board_id,
    )
    .execute(pool)
    .await?;
    Ok(())
}
pub async fn subscribe(user_id: i64, board_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO subscribed_boards (user_id, board_id) VALUES ($1, $2)",
        user_id,
        board_id,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_subscribed_boards(user_id: i64) -> Fallible<Vec<BoardOverview>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(
        BoardOverview,
        r#"
    SELECT boards.board_name, boards.title, boards.id, 0::bigint as "popularity!" FROM subscribed_boards
    LEFT JOIN boards on boards.id = subscribed_boards.board_id
    WHERE subscribed_boards.user_id = $1
    "#,
        user_id
    )
    .fetch_all(pool)
    .await?;
    Ok(boards)
}

pub async fn get_subscribed_user_count(board_id: i64) -> Fallible<usize> {
    let pool = get_pool();
    let count = sqlx::query!(
        "
    SELECT count(*) FROM subscribed_boards
    WHERE subscribed_boards.board_id = $1
    ",
        board_id
    )
    .fetch_one(pool)
    .await?
    .count
    .ok_or(ErrorCode::NotFound(DataType::Board, "".to_owned()).context("查不到訂閱看板人數？？"))?;
    Ok(count as usize)
}
