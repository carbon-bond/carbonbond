use super::get_pool;
use crate::api::model::forum::{ArticleMeta, ArticlePersonalMeta};
use crate::custom_error::Fallible;
use std::collections::HashMap;

struct Entry {
    id: i64,
    count: i64,
    is_satellite: bool,
}

pub async fn get(metas: Vec<&mut ArticleMeta>) -> Fallible {
    let pool = get_pool();
    let ids: Vec<_> = metas.iter().map(|a| a.id).collect();
    // 底下這堆 inner join 真的可以嗎…
    let replies = sqlx::query_as!(
        Entry,
        r#"
        WITH replies AS (
            SELECT abf.value AS id, abf.article_id, (categories.families && '{衛星}') AS is_satellite
        FROM article_bonds abf
            INNER JOIN articles ON articles.id = abf.article_id
            INNER JOIN categories ON categories.id = articles.category_id
        WHERE abf.value = ANY($1))
        SELECT id, COUNT(DISTINCT article_id) as "count!", is_satellite as "is_satellite!" FROM replies
        GROUP BY id, is_satellite
        "#,
        &ids,
    )
    .fetch_all(pool)
    .await?;
    let mut map: HashMap<_, _> = metas.into_iter().map(|meta| (meta.id, meta)).collect();
    for r in replies.into_iter() {
        if let Some(a) = map.get_mut(&r.id) {
            if r.is_satellite {
                a.stat.satellite_replies = r.count;
            } else {
                a.stat.replies = r.count;
            }
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
