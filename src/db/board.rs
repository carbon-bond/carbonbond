use super::{get_pool, DBObject, ToFallible};
use crate::api::model::{Board, BoardName, BoardOverview, NewBoard};
use crate::custom_error::{DataType, Fallible};

impl DBObject for Board {
    const TYPE: DataType = DataType::Board;
}
impl DBObject for BoardName {
    const TYPE: DataType = DataType::Board;
}
impl DBObject for NewBoard {
    const TYPE: DataType = DataType::Board;
}

pub async fn get_by_id(id: i64) -> Fallible<Board> {
    let pool = get_pool();
    let board = sqlx::query_as!(
        Board,
        "SELECT *, 0::bigint as popularity FROM boards WHERE id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(id)?;
    Ok(board)
}

pub async fn get_by_name(name: &str) -> Fallible<Board> {
    let pool = get_pool();
    let board = sqlx::query_as!(
        Board,
        "SELECT *, 0::bigint as popularity FROM boards WHERE board_name = $1",
        name
    )
    .fetch_one(pool)
    .await
    .to_fallible(name)?;
    Ok(board)
}

pub async fn get_all() -> Fallible<Vec<Board>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(Board, "SELECT *, 0::bigint as popularity FROM boards")
        .fetch_all(pool)
        .await?;
    Ok(boards)
}

pub async fn get_all_board_names() -> Fallible<Vec<BoardName>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(BoardName, "SELECT board_name, id FROM boards")
        .fetch_all(pool)
        .await?;
    Ok(boards)
}
pub async fn get_overview(board_ids: &[i64]) -> Fallible<Vec<BoardOverview>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(
        BoardOverview,
        "SELECT board_name, id, title, 0::bigint as popularity FROM boards WHERE id = ANY($1)",
        board_ids
    )
    .fetch_all(pool)
    .await?;
    Ok(boards)
}

pub async fn create(board: &NewBoard) -> Fallible<i64> {
    // TODO: 交易？
    let pool = get_pool();
    let board_id= sqlx::query!(
        "INSERT INTO boards (board_name, detail, title, force, ruling_party_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        board.board_name,
        board.detail,
        board.title,
        board.force,
        board.ruling_party_id
    )
    .fetch_one(pool)
    .await?
    .id;
    super::party::change_board(board.ruling_party_id, board_id).await?;
    Ok(board_id)
}
