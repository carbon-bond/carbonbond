use super::{get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Fallible};

#[derive(Debug, Default)]
pub struct ArticleContent {
    pub article_id: i64,
    pub str_content: Vec<String>,
    pub int_content: Vec<i32>,
}
impl DBObject for ArticleContent {
    const TYPE: DataType = DataType::Content;
}

pub async fn get_by_article_id(id: i64) -> Fallible<ArticleContent> {
    let pool = get_pool();
    let content = sqlx::query_as!(
        ArticleContent,
        "SELECT article_id, str_content, int_content FROM article_contents WHERE article_id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(&id.to_string())?;
    Ok(content)
}

pub(super) async fn create(content: &ArticleContent) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "
        INSERT INTO article_contents (article_id, str_content, int_content)
        VALUES ($1, $2, $3) RETURNING id
        ",
        content.article_id,
        &content.str_content,
        &content.int_content,
    )
    .fetch_one(pool)
    .await?;
    Ok(())
}
