use super::get_pool;
use crate::api::model::ArticleStatistics;
use crate::custom_error::Fallible;

struct Entry {
    id: i64,
    count: i64,
}

pub async fn get_by_ids(
    ids: impl ExactSizeIterator<Item = i64>,
) -> Fallible<impl IntoIterator<Item = ArticleStatistics>> {
    let ids: Vec<_> = ids.collect();
    let pool = get_pool();
    let replies = sqlx::query_as!(
        Entry,
        r#"
        SELECT abf.value AS id, COUNT(DISTINCT abf.article_id) as "count!"
        FROM article_bond_fields abf
        WHERE abf.value = ANY($1)
        GROUP by abf.value ORDER BY abf.value
        "#,
        &ids,
    )
    .fetch_all(pool)
    .await?;

    let mut ret: Vec<_> = ids.iter().map(|_| ArticleStatistics::default()).collect();
    let mut cur_pos = 0;
    for r in replies.into_iter() {
        while r.id > ids[cur_pos] {
            cur_pos += 1;
        }
        ret[cur_pos].replies = r.count;
    }

    Ok(ret.into_iter())
}
