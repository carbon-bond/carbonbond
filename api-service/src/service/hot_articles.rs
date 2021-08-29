use crate::custom_error::{Contextable, Fallible};
use crate::redis::hot_articles;

pub async fn set_hot_article_score(article_id: i64) -> Fallible {
    hot_articles::set_hot_article_score(article_id).await
}
pub async fn get_hot_articles() -> Fallible<Vec<i64>> {
    hot_articles::get_hot_articles().await
}
