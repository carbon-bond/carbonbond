use crate::custom_error::Fallible;
use crate::redis::hot_articles;

pub async fn init() -> Fallible {
    hot_articles::init().await
}

pub async fn update_article_score(article_id: i64) -> Fallible {
    hot_articles::update_article_score(article_id).await
}
pub async fn set_hot_article_score_first_time(article_id: i64) -> Fallible {
    hot_articles::set_hot_article_score_first_time(article_id).await
}
pub async fn get_hot_articles() -> Fallible<Vec<i64>> {
    hot_articles::get_hot_articles().await
}
