use super::{get_pool, DBObject, ToFallible};
use crate::api::model::forum::{Board, BoardName, BoardOverview, NewBoard};
use crate::custom_error::{DataType, Error, Fallible};
use force::parser::parse;

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
        r#"SELECT *, 0::bigint as "popularity!" FROM boards WHERE id = $1"#,
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(id)?;
    Ok(board)
}

pub async fn get_by_name(name: &str, style: &str) -> Fallible<Board> {
    let pool = get_pool();
    let board = sqlx::query_as!(
        Board,
        r#"SELECT *, 0::bigint as "popularity!" FROM boards WHERE board_name = $1 AND board_type = $2"#,
        name,
        style
    )
    .fetch_one(pool)
    .await
    .to_fallible(name)?;
    Ok(board)
}

pub async fn get_all() -> Fallible<Vec<Board>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(Board, r#"SELECT *, 0::bigint as "popularity!" FROM boards"#)
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
        r#"SELECT board_name, id, title, 0::bigint as "popularity!" FROM boards WHERE id = ANY($1)"#,
        board_ids
    )
    .fetch_all(pool)
    .await?;
    Ok(boards)
}

pub async fn create(board: &NewBoard) -> Fallible<i64> {
    let mut conn = get_pool().begin().await?;
    let force = parse(&board.force)?;
    let prev_board_id = sqlx::query!(
        "SELECT board_id FROM parties where id = $1",
        board.ruling_party_id
    )
    .fetch_one(&mut conn)
    .await?;

    if let Some(prev_board_id) = prev_board_id.board_id {
        return Err(Error::new_internal(format!(
            "政黨 {} 已擁有看板 {}",
            board.ruling_party_id, prev_board_id
        )));
    }

    let board_id = sqlx::query!(
        "
        INSERT INTO boards (board_name, board_type, detail, title, force, ruling_party_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        ",
        board.board_name,
        board.board_type,
        board.detail,
        board.title,
        board.force,
        board.ruling_party_id
    )
    .fetch_one(&mut conn)
    .await?
    .id;
    for (name, category) in &force.categories {
        let _category_id = sqlx::query!(
            "
        INSERT INTO categories (board_id, category_name, version, source, families)
        VALUES ($1, $2, 1, $3, $4)
        RETURNING id
        ",
            board_id,
            name,
            category.source,
            &category.family
        )
        .fetch_one(&mut conn)
        .await?
        .id;
    }
    super::party::change_board(&mut conn, board.ruling_party_id, board_id).await?;
    conn.commit().await?;
    Ok(board_id)
}

pub async fn get_category_by_id(id: i64) -> Fallible<String> {
    let pool = get_pool();
    let category_str = sqlx::query!("SELECT source FROM categories WHERE id = $1", id)
        .fetch_one(pool)
        .await?
        .source;
    Ok(category_str)
}
