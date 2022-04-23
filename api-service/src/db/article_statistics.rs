use super::get_pool;
use crate::api::model::forum::ArticleMeta;
use crate::custom_error::Fallible;
use std::collections::HashMap;
use chrono::{Utc, Duration};

struct Entry {
    id: i64,
    replies_count: i64,
    comments_count: i64,
}

pub async fn get(metas: Vec<&mut ArticleMeta>) -> Fallible {
    let pool = get_pool();
    let ids: Vec<_> = metas.iter().map(|a| a.id).collect();
    let counts = sqlx::query_as!(
        Entry,
        r#"
        SELECT
            articles.id,
            COUNT(DISTINCT article_bonds.from_id) AS "replies_count!",
            COUNT(DISTINCT comments.id) AS "comments_count!"
        FROM
            articles
            LEFT JOIN article_bonds ON articles.id = article_bonds.to_id
            LEFT JOIN comments ON articles.id = comments.article_id
        WHERE
            articles.id = ANY($1)
        GROUP BY
            articles.id
        "#,
        &ids,
    )
    .fetch_all(pool)
    .await?;
    let mut map: HashMap<_, _> = metas.into_iter().map(|meta| (meta.id, meta)).collect();
    for r in counts.into_iter() {
        if let Some(a) = map.get_mut(&r.id) {
            a.stat.comments = r.comments_count;
            a.stat.replies = r.replies_count;
        }
    }
    Ok(())
}

pub async fn get_personal(metas: Vec<&mut ArticleMeta>, user_id: i64) -> Fallible {
    let pool = get_pool();
    let ids: Vec<_> = metas.iter().map(|a| a.id).collect();
    let personal_favorites = sqlx::query!(
        "SELECT article_id FROM favorite_articles
        WHERE user_id = $1 AND article_id = ANY($2)",
        user_id,
        &ids,
    )
    .fetch_all(pool)
    .await?;
    let personal_trackings = sqlx::query!(
        "SELECT article_id FROM tracking_articles
        WHERE user_id = $1 AND article_id = ANY($2)",
        user_id,
        &ids,
    )
    .fetch_all(pool)
    .await?;
    let mut map: HashMap<_, _> = metas.into_iter().map(|meta| (meta.id, meta)).collect();
    for p in personal_favorites.into_iter() {
        if let Some(a) = map.get_mut(&p.article_id) {
            a.personal_meta.is_favorite = true;
        }
    }
    for p in personal_trackings.into_iter() {
        if let Some(a) = map.get_mut(&p.article_id) {
            a.personal_meta.is_tracking = true;
        }
    }
    Ok(())
}

pub async fn get_all_articles_in_24h() -> Fallible<Vec<(i64, u64)>> {
    let pool = get_pool();
    let articles_in_24h = sqlx::query!(
        "SELECT board_id, create_time FROM articles
        WHERE create_time > $1",
        Utc::now() - Duration::days(1),
    )
    .fetch_all(pool)
    .await?;
    Ok(articles_in_24h.iter().map(|a| (a.board_id, a.create_time.timestamp() as u64)).collect())
}
