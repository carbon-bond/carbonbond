use super::get_pool;
use crate::custom_error::Fallible;

pub async fn query_tracking_articles(user_id: i64, count: usize) -> Fallible<Vec<i64>> {
    let pool = get_pool();

    let article_ids = sqlx::query!(
        "
        SELECT * FROM articles
        WHERE author_id IN (SELECT to_user FROM user_relations WHERE from_user = $1) OR
        id IN (SELECT article_id FROM tracking_articles WHERE user_id = $1)
        ORDER BY create_time DESC
        LIMIT $2
        ",
        user_id,
        count as i64
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|rec| rec.id)
    .collect();

    Ok(article_ids)
}

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
