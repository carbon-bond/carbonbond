use super::get_pool;
use crate::api::model::forum::Draft;
use crate::custom_error::Fallible;

pub async fn create_draft(
    board_id: i64,
    category: Option<String>,
    title: String,
    content: String,
    author_id: i64,
    anonymous: bool,
) -> Fallible<i64> {
    let pool = get_pool();
    let draft_id = sqlx::query!(
        "
        INSERT INTO drafts (author_id, board_id, title, category, content, anonymous)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        ",
        author_id,
        board_id,
        title,
        category,
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
    category: Option<String>,
    title: String,
    content: String,
    author_id: i64,
    anonymous: bool,
) -> Fallible<i64> {
    let pool = get_pool();
    // 僅有作者本人可以更新草稿
    sqlx::query!(
        "
        UPDATE drafts
        SET
        board_id=$2,
        title=$3,
        category=$4,
        content=$5,
        anonymous=$6
        WHERE id=$7 AND author_id=$1
        ",
        author_id,
        board_id,
        title,
        category,
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
        drafts.category as "category?",
        drafts.title,
        drafts.content,
        drafts.create_time,
        drafts.edit_time,
        drafts.anonymous
        FROM drafts
        JOIN boards ON drafts.board_id = boards.id
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
