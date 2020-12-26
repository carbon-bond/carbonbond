use super::get_pool;
use crate::api::model::ArticleMeta;
use crate::api::model::Favorite;
use crate::custom_error::Fallible;

const EMPTY_SET: &[String] = &[];

pub async fn get_by_user_id(id: i64) -> Fallible<impl ExactSizeIterator<Item = Favorite>> {
    let pool = get_pool();
    let data = metas!(
        "metas.*, favorite_articles.create_time AS favorite_create_time",
        "
        INNER JOIN favorite_articles ON metas.id = favorite_articles.article_id
        WHERE favorite_articles.user_id = $3
        ",
        true,
        EMPTY_SET,
        id
    )
    .fetch_all(pool)
    .await?;
    Ok(data.into_iter().map(|d| to_favorite!(d)))
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
