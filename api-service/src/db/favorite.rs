use super::get_pool;
use crate::{api::model::forum::ArticleMeta, custom_error::Fallible};

const EMPTY_SET: &[String] = &[];

pub async fn get_by_user_id(id: i64) -> Fallible<Vec<ArticleMeta>> {
    let pool = get_pool();
    let metas = metas!(
        crate::api::model::forum::PrimitiveArticleMeta,
        "",
        "
        INNER JOIN favorite_articles ON metas.id = favorite_articles.article_id
        WHERE favorite_articles.user_id = $3
        ORDER BY favorite_articles.create_time DESC
        ",
        true,
        EMPTY_SET,
        id
    )
    .fetch_all(pool)
    .await?;
    Ok(metas
        .into_iter()
        .map(move |d| to_meta!(d, Some(id)))
        .collect())
}

pub async fn favorite(user_id: i64, article_id: i64) -> Fallible<i64> {
    let pool = get_pool();
    let favorite_id = sqlx::query!(
        "
        INSERT INTO favorite_articles (user_id, article_id)
        VALUES ($1, $2) RETURNING id
        ",
        user_id,
        article_id,
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(favorite_id)
}

pub async fn unfavorite(user_id: i64, article_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "DELETE FROM favorite_articles WHERE user_id = $1 AND article_id = $2",
        user_id,
        article_id,
    )
    .execute(pool)
    .await?;
    Ok(())
}
