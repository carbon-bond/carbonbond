use super::get_pool;
use crate::api::model::ArticleMeta;
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
        FROM article_bond_fields abf
            INNER JOIN articles ON articles.id = abf.article_id
            INNER JOIN categories ON categories.id = articles.category_id
        WHERE abf.value = ANY($1))
        SELECT id, COUNT(DISTINCT article_id) as "count!", is_satellite as "is_satellite!" FROM replies
        GROUP BY id, is_satellite ORDER BY id
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
