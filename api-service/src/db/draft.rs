use super::{get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Error, Fallible};

pub async fn get_all() -> Fallible<Vec<Board>> {
    let pool = get_pool();
    let boards = sqlx::query_as!(Board, r#"SELECT *, 0::bigint as "popularity!" FROM boards"#)
        .fetch_all(pool)
        .await?;
    Ok(boards)
}
