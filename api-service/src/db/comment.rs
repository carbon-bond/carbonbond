use super::get_pool;
use crate::api::model::forum::{Author, Comment};
use crate::custom_error::Fallible;

pub async fn get_by_article_id(article_id: i64) -> Fallible<Vec<Comment>> {
    let pool = get_pool();
    let comments = sqlx::query!(
        r#"
        SELECT
            comments.id, comments.author_id, users.user_name, comments.create_time, comments.content
        FROM
            comments JOIN users on comments.author_id = users.id
        WHERE
            comments.article_id = $1
        ORDER BY comments.create_time
        "#,
        article_id
    )
    .fetch_all(pool)
    .await?;

    let comments = comments
        .into_iter()
        .map(|comment| Comment {
            id: comment.id,
            author: Author::NamedAuthor {
                name: comment.user_name,
                id: comment.author_id,
            },
            content: comment.content,
            create_time: comment.create_time,
        })
        .collect();

    Ok(comments)
}

pub async fn create(author_id: i64, article_id: i64, content: String) -> Fallible<i64> {
    let pool = get_pool();

    let comment_id = sqlx::query!(
        "
        INSERT INTO comments (author_id, article_id, content)
        VALUES ($1, $2, $3)
        RETURNING id
        ",
        author_id,
        article_id,
        content
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(comment_id)
}