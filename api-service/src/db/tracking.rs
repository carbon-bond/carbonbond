use super::get_pool;
use crate::api::model::ArticleMeta;
use crate::api::model::Tracking;
use crate::custom_error::Fallible;
use std::collections::HashSet;

pub async fn query_tracking_articles(user_id: i64) -> Fallible<Vec<i64>> {
    let pool = get_pool();
    // let mut article_ids = Vec::new();
    let mut article_ids = HashSet::new();

    let tracking_articles = sqlx::query!(
        "
        SELECT * FROM tracking_articles WHERE user_id = $1
        ",
        user_id
    )
    .fetch_all(pool)
    .await?;

    for article in tracking_articles.iter() {
        // article_ids.push(article.article_id);
        article_ids.insert(article.article_id);
    }

    let follower_or_hater_articles = sqlx::query!(
        "
        select * from articles where author_id in (select to_user from user_relations where from_user = $1) 
        ",
        user_id
    )
    .fetch_all(pool)
    .await?;

    for article in follower_or_hater_articles.iter() {
        // article_ids.push(article.id);
        article_ids.insert(article.id);
    }

    // log::debug!("tracking_articles 結果：{:?}", article_ids);
    // let article_ids_set: HashSet<_> = article_ids.drain(..).collect();
    // article_ids.extend(article_ids_set.into_iter());
    // log::debug!("tracking_articles 結果：{:?}", article_ids);
    let article_ids = article_ids.into_iter().collect();

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
