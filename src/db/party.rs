use super::{get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Fallible};

#[derive(Debug, Default)]
pub struct Party {
    pub id: i64,
    pub party_name: String,
    pub board_id: Option<i64>,
    pub energy: i32,
    pub chairman_id: i64,
    pub create_time: Option<chrono::DateTime<chrono::Utc>>,
}
impl DBObject for Party {
    const TYPE: DataType = DataType::Article;
}

pub async fn get_by_name(name: &str) -> Fallible<Party> {
    let pool = get_pool();
    let party = sqlx::query_as!(Party, "SELECT * FROM parties WHERE party_name = $1", name)
        .fetch_one(pool)
        .await
        .to_fallible(name)?;
    Ok(party)
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
                INSERT INTO parties (party_name, board_id, chairman_id)
                SELECT $1, boards.id, $2
                FROM boards
                WHERE boards.board_name = $3
                RETURNING id
                ",
                party_name,
                chairman_id,
                board_name
            )
            .fetch_one(pool)
            .await?
            .id
        }
        None => {
            sqlx::query!(
                "
                INSERT INTO parties (party_name, chairman_id)
                VALUES ($1, $2) RETURNING id
                ",
                party_name,
                chairman_id,
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

pub async fn change_board(party_id: i64, board_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "UPDATE parties SET board_id = $1 where id = $2",
        board_id,
        party_id
    )
    .execute(pool)
    .await?;
    Ok(())
}
