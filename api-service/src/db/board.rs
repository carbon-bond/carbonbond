use chrono::{DateTime, Utc};

use super::{get_pool, DBObject, ToFallible};
use crate::api::model::forum::{Board, BoardName, BoardOverview, NewBoard};
use crate::custom_error::{DataType, Error, Fallible};

impl DBObject for DBBoard {
    const TYPE: DataType = DataType::Board;
}
impl DBObject for BoardName {
    const TYPE: DataType = DataType::Board;
}
impl DBObject for NewBoard {
    const TYPE: DataType = DataType::Board;
}

struct DBBoard {
    pub id: i64,
    pub board_name: String,
    pub board_type: String,
    pub create_time: DateTime<Utc>,
    pub title: String,
    pub detail: String,
    pub force: String,
    pub ruling_party_id: i64,
    pub popularity: i64,
}

impl DBBoard {
    fn to_board(self) -> Board {
        Board {
            id: self.id,
            board_name: self.board_name,
            board_type: self.board_type,
            create_time: self.create_time,
            title: self.title,
            detail: self.detail,
            force: serde_json::from_str(&self.force).unwrap(),
            ruling_party_id: self.ruling_party_id,
            popularity: self.popularity,
        }
    }
}

pub async fn get_by_id(id: i64) -> Fallible<Board> {
    let pool = get_pool();
    let board = sqlx::query_as!(
        DBBoard,
        r#"SELECT *, 0::bigint as "popularity!" FROM boards WHERE id = $1"#,
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(id)?;
    Ok(board.to_board())
}

pub async fn get_by_name(name: &str, style: &str) -> Fallible<Board> {
    let pool = get_pool();
    let board = sqlx::query_as!(
        DBBoard,
        r#"SELECT *, 0::bigint as "popularity!" FROM boards WHERE board_name = $1 AND board_type = $2"#,
        name,
        style
    )
    .fetch_one(pool)
    .await
    .to_fallible(name)?;
    Ok(board.to_board())
}

pub async fn get_all() -> Fallible<Vec<Board>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(
        DBBoard,
        r#"SELECT *, 0::bigint as "popularity!" FROM boards"#
    )
    .fetch_all(pool)
    .await?;
    Ok(boards.into_iter().map(|b| b.to_board()).collect())
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
        serde_json::to_string(&board.force).unwrap(),
        board.ruling_party_id
    )
    .fetch_one(&mut conn)
    .await?
    .id;
    // force-FIXME: 捨棄 category 表格
    let _category_id = sqlx::query!(
        "
    INSERT INTO categories (board_id, category_name, version, source)
    VALUES ($1, $2, 1, $3)
    RETURNING id
    ",
        board_id,
        "",
        ""
    )
    .fetch_one(&mut conn)
    .await?
    .id;
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
