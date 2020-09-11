use super::{article_content, get_pool, DBObject, ToFallible};
use crate::api::model::{Article, ArticleMeta};
use crate::custom_error::{DataType, Fallible};
use force::parse_category;

impl DBObject for ArticleMeta {
    const TYPE: DataType = DataType::Article;
}

pub async fn get_by_id(id: i64) -> Fallible<Article> {
    let pool = get_pool();
    let meta = sqlx::query_as!(
        ArticleMeta,
        "
        SELECT articles.*, users.user_name as author_name, boards.board_name, categories.category_name, categories.source as category_source FROM articles
        INNER JOIN users on articles.author_id = users.id
        INNER JOIN boards on articles.board_id = boards.id
        INNER JOIN categories on articles.category_id = categories.id
        WHERE articles.id = $1
        ",
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(&id.to_string())?;
    let content = article_content::get_by_article_id(id).await?;
    Ok(Article { meta, content })
}

pub async fn get_by_board_name(
    board_name: &str,
    offset: i64,
    limit: usize,
) -> Fallible<Vec<Article>> {
    let pool = get_pool();
    let metas = sqlx::query_as!(
        ArticleMeta,
        "
        SELECT articles.*, users.user_name as author_name, boards.board_name, categories.category_name, categories.source as category_source FROM articles
        INNER JOIN users on articles.author_id = users.id
        INNER JOIN boards on articles.board_id = boards.id
        INNER JOIN categories on articles.category_id = categories.id
        WHERE boards.board_name = $1
        ORDER BY articles.create_time DESC
        LIMIT $2 OFFSET $3
        ",
        board_name,
        limit as i64,
        offset
    )
    .fetch_all(pool)
    .await?;

    // XXX: n + 1 問題
    let mut articles = Vec::new();
    for meta in metas.into_iter() {
        let content = article_content::get_by_article_id(meta.id).await?;
        articles.push(Article { meta, content });
    }
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
    article_content::create(
        article_id,
        board_id,
        &content,
        parse_category(&category.source)?,
    )
    .await?;
    Ok(article_id)
}
