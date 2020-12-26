use super::get_pool;
use crate::api::model::{ArticleMeta, ArticleStatistics};
use crate::custom_error::Fallible;

struct Entry {
    id: i64,
    count: i64,
    is_small: bool,
}

pub async fn get(metas: Vec<&mut ArticleMeta>) -> Fallible {
    let pool = get_pool();
    let ids: Vec<_> = metas.iter().map(|a| a.id).collect();
    // 底下這堆 inner join 真的可以嗎…
    let replies = sqlx::query_as!(
        Entry,
        r#"
        WITH replies AS (
            SELECT abf.value AS id, abf.article_id, (categories.families && '{小的}') AS is_small
        FROM article_bond_fields abf
            INNER JOIN articles ON articles.id = abf.article_id
            INNER JOIN categories ON categories.id = articles.category_id
        WHERE abf.value = ANY($1))
        SELECT id, COUNT(DISTINCT article_id) as "count!", is_small as "is_small!" FROM replies
        GROUP BY id, is_small ORDER BY id
        "#,
        &ids,
    )
    .fetch_all(pool)
    .await?;
    let mut replies: &[_] = &replies;

    for meta in metas.into_iter() {
        let (id, stat) = (meta.id, &mut meta.stat);
        if let Some((is_small, r)) = extract_from_stats(id, &mut replies) {
            if is_small {
                stat.small_replies = r;
            } else {
                stat.replies = r;
            }
        }
        if let Some((is_small, r)) = extract_from_stats(id, &mut replies) {
            if is_small {
                stat.small_replies = r;
            } else {
                stat.replies = r;
            }
        }
    }
    Ok(())
}

fn extract_from_stats(cur_id: i64, series: &mut &[Entry]) -> Option<(bool, i64)> {
    loop {
        match series.first() {
            Some(entry) => {
                if entry.id == cur_id {
                    *series = &series[1..series.len()];
                    return Some((entry.is_small, entry.count));
                } else if entry.id < cur_id {
                    *series = &series[1..series.len()];
                } else {
                    return None;
                }
            }
            None => {
                return None;
            }
        }
    }
}
