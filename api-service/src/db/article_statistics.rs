use super::get_pool;
use crate::api::model::forum::{ArticleMeta, Attitude};
use crate::custom_error::Fallible;
use chrono::{DateTime, Duration, Utc};
use std::collections::HashMap;

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
    let personal_attitudes = sqlx::query!(
        "SELECT article_id, attitude FROM attitude_to_articles
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
    for p in personal_attitudes.into_iter() {
        if let Some(a) = map.get_mut(&p.article_id) {
            a.personal_meta.attitude = if p.attitude {
                Attitude::Good
            } else {
                Attitude::Bad
            };
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
    Ok(articles_in_24h
        .iter()
        .map(|a| (a.board_id, a.create_time.timestamp() as u64))
        .collect())
}

pub async fn get_latest_n_articles(n: usize) -> Fallible<Vec<(i64, u64)>> {
    let pool = get_pool();
    let articles = sqlx::query!(
        "SELECT id, create_time FROM articles
        ORDER BY create_time DESC LIMIT $1",
        n as i64,
    )
    .fetch_all(pool)
    .await?;
    Ok(articles
        .iter()
        .map(|a| (a.id as i64, a.create_time.timestamp() as u64))
        .collect())
}

pub async fn get_article_and_energy_after_a_timestamp(
    timestamp: DateTime<Utc>,
) -> Fallible<Vec<(i64, f32, u64)>> {
    let pool = get_pool();
    let articles_in_top_n = sqlx::query!(
        "SELECT id, energy, create_time FROM articles
        WHERE create_time > $1",
        timestamp,
    )
    .fetch_all(pool)
    .await?;
    Ok(articles_in_top_n
        .iter()
        .map(|a| {
            (
                a.id as i64,
                a.energy as f32,
                a.create_time.timestamp() as u64,
            )
        })
        .collect())
}

pub async fn get_article_and_energy_by_id(article_id: i64) -> Fallible<(i64, f32, u64)> {
    let pool = get_pool();
    let article = sqlx::query!(
        "SELECT id, energy, create_time FROM articles
        WHERE id = $1",
        article_id,
    )
    .fetch_one(pool)
    .await?;
    Ok((
        article.id,
        article.energy as f32,
        article.create_time.timestamp() as u64,
    ))
}
