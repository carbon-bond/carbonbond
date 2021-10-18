use super::get_pool;
use crate::api::model::Draft;
use crate::custom_error::Fallible;
use crate::db::article::get_newest_category;

pub async fn get_category_id(
    board_id: i64,
    category_name: &Option<String>,
) -> Fallible<Option<i64>> {
    let id = match category_name {
        None => None,
        Some(name) => Some(get_newest_category(board_id, &name).await?.id),
    };
    Ok(id)
}

pub async fn create_draft(
    board_id: i64,
    category_name: Option<String>,
    title: String,
    content: String,
    author_id: i64,
    anonymous: bool,
) -> Fallible<i64> {
    let category_id = get_category_id(board_id, &category_name).await?;
    let pool = get_pool();
    let draft_id = sqlx::query!(
        "
        INSERT INTO drafts (author_id, board_id, title, category_id, content, anonymous)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        ",
        author_id,
        board_id,
        title,
        category_id,
        content,
        anonymous
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(draft_id)
}

pub async fn update_draft(
    draft_id: i64,
    board_id: i64,
    category_name: Option<String>,
    title: String,
    content: String,
    author_id: i64,
    anonymous: bool,
) -> Fallible<i64> {
    let category_id = get_category_id(board_id, &category_name).await?;
    let pool = get_pool();
    sqlx::query!(
        "
        UPDATE drafts
        SET
        author_id=$1,
        board_id=$2,
        title=$3,
        category_id=$4,
        content=$5,
        anonymous=$6
        WHERE id=$7
        ",
        author_id,
        board_id,
        title,
        category_id,
        content,
        anonymous,
        draft_id,
    )
    .execute(pool)
    .await?;
    return Ok(draft_id);
}

pub async fn get_all(author_id: i64) -> Fallible<Vec<Draft>> {
    let pool = get_pool();
    let drafts = sqlx::query_as!(
        Draft,
        r#"
        SELECT
        drafts.id, drafts.author_id, drafts.board_id,
        boards.board_name,
        drafts.category_id as "category_id?",
        categories.category_name as "category_name?",
        drafts.title,
        drafts.content,
        drafts.create_time,
        drafts.edit_time,
        drafts.anonymous
        FROM drafts
        JOIN boards ON drafts.board_id = boards.id
        LEFT JOIN categories ON drafts.category_id = categories.id
        WHERE drafts.author_id = $1
        ORDER BY create_time DESC
        "#,
        author_id
    )
    .fetch_all(pool)
    .await?;
    Ok(drafts)
}

pub async fn delete(draft_id: i64) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query_as!(
        Draft,
        "
            DELETE FROM drafts
            WHERE id = $1
        ",
        draft_id
    )
    .execute(pool)
    .await?;
    Ok(())
}
