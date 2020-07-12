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

pub async fn create(party: &Party) -> Fallible<i64> {
    let pool = get_pool();
    let res = sqlx::query!(
        "
        INSERT INTO parties (party_name, board_id, chairman_id)
        VALUES ($1, $2, $3) RETURNING id
        ",
        party.party_name,
        party.board_id,
        party.chairman_id,
    )
    .fetch_one(pool)
    .await?;
    Ok(res.id)
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
