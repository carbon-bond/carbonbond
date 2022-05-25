use chrono::{DateTime, Utc};

use super::{get_pool, user, DBObject, ToFallible};
use crate::api::model::forum::{
    Board, BoardName, BoardOverview, BoardType, NewBoard, UpdatedBoard,
};
use crate::custom_error::{DataType, Error, Fallible};
use std::str::FromStr;

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
    fn to_board(self) -> Fallible<Board> {
        Ok(Board {
            id: self.id,
            board_name: self.board_name,
            board_type: BoardType::from_str(&self.board_type)?,
            create_time: self.create_time,
            title: self.title,
            detail: self.detail,
            force: serde_json::from_str(&self.force).unwrap(),
            ruling_party_id: self.ruling_party_id,
            popularity: self.popularity,
        })
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
    board.to_board()
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
    board.to_board()
}

pub async fn get_all() -> Fallible<Vec<Board>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(
        DBBoard,
        r#"SELECT *, 0::bigint as "popularity!" FROM boards"#
    )
    .fetch_all(pool)
    .await?;
    let mut ret = Vec::new();
    for board in boards {
        ret.push(board.to_board()?);
    }
    Ok(ret)
}

pub async fn get_all_board_names() -> Fallible<Vec<BoardName>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(BoardName, "SELECT board_name, id FROM boards")
        .fetch_all(pool)
        .await?;
    Ok(boards)
}
struct DBBoardOverview {
    pub id: i64,
    pub board_name: String,
    pub board_type: String,
    pub title: String,
    pub popularity: i64,
}
pub async fn is_editable(board_id: i64, user_id: i64) -> Fallible<bool> {
    let pool = get_pool();

    // 判定公開板
    let exist = sqlx::query!(
        "
        select boards.id
        from boards
        join parties
            on boards.ruling_party_id = parties.id
        join party_members
            on parties.id = party_members.party_id
        where user_id = $1 and boards.id = $2;
        ",
        user_id,
        board_id
    )
    .fetch_optional(pool)
    .await?;
    if exist.is_some() {
        return Ok(true);
    }

    // 判定個板
    let user = user::get_by_id(user_id).await?;
    let board = get_by_id(board_id).await?;
    if user.user_name == board.board_name && board.ruling_party_id == -1 {
        return Ok(true);
    }

    Ok(false)
}
pub async fn get_overview(board_ids: &[i64]) -> Fallible<Vec<BoardOverview>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(
        DBBoardOverview,
        r#"SELECT board_name, board_type, id, title, 0::bigint as "popularity!" FROM boards WHERE id = ANY($1)"#,
        board_ids
    )
    .fetch_all(pool)
    .await?;
    let mut ret = Vec::new();
    for board in boards {
        ret.push(BoardOverview {
            board_type: BoardType::from_str(&board.board_type)?,
            id: board.id,
            board_name: board.board_name,
            title: board.title,
            popularity: board.popularity,
        });
    }
    Ok(ret)
}

pub async fn create(board: &NewBoard) -> Fallible<i64> {
    // 檢查力語言語義
    board.force.check_semantic()?;

    let mut conn = get_pool().begin().await?;

    if board.ruling_party_id != -1 {
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
    }

    let board_id = sqlx::query!(
        "
        INSERT INTO boards (board_name, board_type, detail, title, force, ruling_party_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        ",
        board.board_name,
        board.board_type.to_string(),
        board.detail,
        board.title,
        serde_json::to_string(&board.force).unwrap(),
        board.ruling_party_id
    )
    .fetch_one(&mut conn)
    .await?
    .id;
    super::party::change_board(&mut conn, board.ruling_party_id, board_id).await?;
    conn.commit().await?;
    Ok(board_id)
}

pub async fn update(board: &UpdatedBoard) -> Fallible<i64> {
    // 檢查力語言語義
    board.force.check_semantic()?;
    let mut conn = get_pool().begin().await?;
    sqlx::query!(
        "
        UPDATE boards
        SET
        title = $1,
        detail = $2,
        force = $3
        WHERE id = $4
        ",
        board.title,
        board.detail,
        serde_json::to_string(&board.force).unwrap(),
        board.id
    )
    .execute(&mut conn)
    .await?;
    conn.commit().await?;
    Ok(board.id)
}
