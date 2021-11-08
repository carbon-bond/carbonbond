use super::{get_pool, DBObject, ToFallible};
use crate::api::model::forum::Party;
use crate::custom_error::{DataType, Fallible};
use sqlx::PgConnection;

impl DBObject for Party {
    const TYPE: DataType = DataType::Party;
}

macro_rules! parties {
    ($remain:literal, $($arg:expr),*) => {
        // XXX: 密切關注 sql issue-367，可以避免底下的 board_name 硬轉
        sqlx::query_as!(
            Party,
            r#"
        SELECT parties.*, boards.board_name as "board_name?" FROM parties
        LEFT JOIN boards on boards.id = parties.board_id
            "# + $remain,
            $($arg),*
        )
    };
}
pub async fn get_by_name(name: &str) -> Fallible<Party> {
    let pool = get_pool();
    let party = parties!("WHERE parties.party_name = $1", name)
        .fetch_one(pool)
        .await
        .to_fallible(name)?;
    Ok(party)
}

pub async fn get_by_member_id(id: i64) -> Fallible<Vec<Party>> {
    let pool = get_pool();
    let parties = parties!(
        "
    INNER JOIN party_members ON parties.id = party_members.party_id
    WHERE user_id = $1
        ",
        id
    )
    .fetch_all(pool)
    .await?;
    Ok(parties)
}

pub async fn create(
    party_name: &str,
    board_name: Option<String>,
    chairman_id: i64,
) -> Fallible<i64> {
    let pool = get_pool();
    let party_id = match board_name {
        Some(board_name) => {
            sqlx::query!(
                "
                INSERT INTO parties (party_name, board_id)
                SELECT $1, boards.id
                FROM boards
                WHERE boards.board_name = $2
                RETURNING id
                ",
                party_name,
                board_name
            )
            .fetch_one(pool)
            .await?
            .id
        }
        None => {
            sqlx::query!(
                "
                INSERT INTO parties (party_name)
                VALUES ($1) RETURNING id
                ",
                party_name,
            )
            .fetch_one(pool)
            .await?
            .id
        }
    };
    sqlx::query!(
        "
        INSERT INTO party_members (party_id, user_id)
        VALUES ($1, $2) RETURNING id
        ",
        party_id,
        chairman_id,
    )
    .fetch_one(pool)
    .await?;
    Ok(party_id)
}

pub async fn change_board(conn: &mut PgConnection, party_id: i64, board_id: i64) -> Fallible<()> {
    sqlx::query!(
        "UPDATE parties SET board_id = $1, ruling = true where id = $2",
        board_id,
        party_id
    )
    .execute(conn)
    .await?;
    Ok(())
}

pub async fn get_by_board_id(id: i64) -> Fallible<Vec<Party>> {
    let pool = get_pool();
    let parties = parties!("WHERE parties.board_id = $1", id)
        .fetch_all(pool)
        .await?;
    Ok(parties)
}
