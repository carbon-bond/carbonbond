use super::get_pool;
use crate::api::model::ArticleMeta;
use crate::api::model::Tracking;
use crate::custom_error::Fallible;

pub async fn tracking(user_id: i64, article_id: i64) -> Fallible<i64> {
    let pool = get_pool();
    let tracking_id = sqlx::query!(
        "
        INSERT INTO tracking_articles (user_id, article_id)
        VALUES ($1, $2) RETURNING id
        ",
        user_id,
        article_id,
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(tracking_id)
}

pub async fn untracking(user_id: i64, article_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "DELETE FROM tracking_articles WHERE user_id = $1 AND article_id = $2",
        user_id,
        article_id,
    )
    .execute(pool)
    .await?;
    Ok(())
}
