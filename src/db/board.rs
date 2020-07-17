use super::{get_pool, DBObject, ToFallible};
use crate::api::model::{Board, NewBoard};
use crate::custom_error::{DataType, Fallible};

impl DBObject for Board {
    const TYPE: DataType = DataType::Board;
}
impl DBObject for NewBoard {
    const TYPE: DataType = DataType::Board;
}

pub async fn get_by_id(id: i64) -> Fallible<Board> {
    let pool = get_pool();
    let user = sqlx::query_as!(Board, "SELECT * FROM boards WHERE id = $1", id)
        .fetch_one(pool)
        .await
        .to_fallible(id)?;
    Ok(user)
}

pub async fn get_by_name(name: &str) -> Fallible<Board> {
    let pool = get_pool();
    let user = sqlx::query_as!(Board, "SELECT * FROM boards WHERE board_name = $1", name)
        .fetch_one(pool)
        .await
        .to_fallible(name)?;
    Ok(user)
}

pub async fn create(board: &NewBoard) -> Fallible<i64> {
    // TODO: 交易？
    let pool = get_pool();
    let board_id= sqlx::query!(
        "INSERT INTO boards (board_name, detail, title, ruling_party_id) VALUES ($1, $2, $3, $4) RETURNING id",
        board.board_name,
        board.detail,
        board.title,
        board.ruling_party_id
    )
    .fetch_one(pool)
    .await?
    .id;
    super::party::change_board(board.ruling_party_id, board_id).await?;
    Ok(board_id)
}
