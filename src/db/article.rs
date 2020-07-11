use super::{get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Fallible};

#[derive(Debug, Default)]
pub struct Article {
    id: i64,
    board_id: i64,
    root_id: i64,
    category_id: i64,
    title: String,
    author_id: i64,
    show_in_list: bool,
    create_time: Option<chrono::DateTime<chrono::Utc>>,
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

pub async fn create(article: Article) -> Fallible<i64> {
    let pool = get_pool();
    let res = sqlx::query!(
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
    .await?;
    Ok(res.id)
}
