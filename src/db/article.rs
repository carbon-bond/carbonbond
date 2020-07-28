use super::{article_content, get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Fallible};

#[derive(Debug)]
pub struct Article {
    pub id: i64,
    pub board_id: i64,
    pub root_id: i64,
    pub category_id: i64,
    pub title: String,
    pub author_id: i64,
    pub show_in_list: bool,
    pub create_time: chrono::DateTime<chrono::Utc>,
}
impl DBObject for Article {
    const TYPE: DataType = DataType::Article;
}

pub async fn get_by_id(id: i64) -> Fallible<Article> {
    let pool = get_pool();
    let article = sqlx::query_as!(Article, "SELECT * FROM articles WHERE id = $1", id)
        .fetch_one(pool)
        .await
        .to_fallible(&id.to_string())?;
    Ok(article)
}
pub async fn get_by_board_id(board_id: i64, offset: i64, limit: i64) -> Fallible<Vec<Article>> {
    let pool = get_pool();
    let articles = sqlx::query_as!(
        Article,
        "SELECT * FROM articles WHERE board_id = $1 LIMIT $2 OFFSET $3",
        board_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await?;
    Ok(articles)
}

pub async fn create(
    article: &Article,
    str_content: Vec<String>,
    int_content: Vec<i32>,
) -> Fallible<i64> {
    // TODO: 交易？
    let pool = get_pool();
    let article_id = sqlx::query!(
        "
        INSERT INTO articles (board_id, root_id, title, category_id, author_id)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
        ",
        article.board_id,
        article.root_id,
        article.title,
        article.category_id,
        article.author_id,
    )
    .fetch_one(pool)
    .await?
    .id;
    article_content::create(&article_content::ArticleContent {
        article_id,
        str_content,
        int_content,
    })
    .await?;
    Ok(article_id)
}
