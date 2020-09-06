use super::{article_content, get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Fallible};

#[derive(Debug)]
pub struct Article {
    pub id: i64,
    pub board_id: i64,
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

#[derive(Debug)]
pub struct Category {
    pub id: i64,
    pub board_id: i64,
    pub category_name: String,
    pub version: i64,
    pub source: String,
    pub create_time: chrono::DateTime<chrono::Utc>,
}
impl DBObject for Category {
    const TYPE: DataType = DataType::Category;
}

async fn get_newest_category(board_id: i64, category_name: String) -> Fallible<Category> {
    let pool = get_pool();
    let category = sqlx::query_as!(
        Category,
        "
        SELECT * FROM categories WHERE board_id = $1 AND category_name = $2
        ORDER BY version DESC
        LIMIT 1
        ",
        board_id,
        category_name
    )
    .fetch_one(pool)
    .await?;
    Ok(category)
}

fn parse_category(source: &str) -> Fallible<force::parser::Category> {
    let f = force::parser::parse(source)?;
    Ok(f.categories.into_iter().next().unwrap().1)
}

pub async fn create(
    author_id: i64,
    board_id: i64,
    category_name: String,
    title: String,
    content: String,
) -> Fallible<i64> {
    // TODO: 交易？
    let pool = get_pool();
    let category = get_newest_category(board_id, category_name).await?;
    let article_id = sqlx::query!(
        "
        INSERT INTO articles (author_id, board_id, title, category_id)
        VALUES ($1, $2, $3, $4) RETURNING id
        ",
        author_id,
        board_id,
        title,
        category.id,
    )
    .fetch_one(pool)
    .await?
    .id;
    article_content::create(article_id, &content, parse_category(&category.source)?).await?;
    Ok(article_id)
}
