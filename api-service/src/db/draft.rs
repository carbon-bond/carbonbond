use chrono::DateTime;

use super::article::get_category;
use super::get_pool;
use crate::api::model::forum::Draft;
use crate::custom_error::Fallible;

pub async fn create_draft(
    board_id: i64,
    category: Option<String>,
    title: String,
    content: String,
    bonds: String,
    author_id: i64,
    anonymous: bool,
) -> Fallible<i64> {
    let fields = match category {
        Some(ref category_name) => get_category(board_id, category_name).await?.fields,
        None => Vec::new(),
    };
    let pool = get_pool();
    let draft_id = sqlx::query!(
        "
        INSERT INTO drafts (author_id, board_id, title, category, fields, content, bonds, anonymous)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        ",
        author_id,
        board_id,
        title,
        category,
        serde_json::to_string(&fields).unwrap(),
        content,
        bonds,
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
    bonds: String,
    author_id: i64,
    anonymous: bool,
) -> Fallible<i64> {
    let fields = match category {
        Some(ref category_name) => get_category(board_id, category_name).await?.fields,
        None => Vec::new(),
    };
    let pool = get_pool();
    // 僅有作者本人可以更新草稿
    sqlx::query!(
        "
        UPDATE drafts
        SET
        board_id=$2,
        title=$3,
        category=$4,
        fields=$5,
        content=$6,
        anonymous=$7,
        bonds=$8
        WHERE id=$9 AND author_id=$1
        ",
        author_id,
        board_id,
        title,
        category,
        serde_json::to_string(&fields).unwrap(),
        content,
        anonymous,
        bonds,
        draft_id,
    )
    .execute(pool)
    .await?;
    Ok(draft_id)
}

pub struct _Draft {
    pub id: i64,
    pub author_id: i64,
    pub board_id: i64,
    pub board_name: String,
    pub category: Option<String>,
    pub fields: String,
    pub title: String,
    pub content: String,
    pub bonds: String,
    pub create_time: DateTime<chrono::Utc>,
    pub edit_time: DateTime<chrono::Utc>,
    pub anonymous: bool,
}
impl _Draft {
    fn to_draft(self) -> Draft {
        Draft {
            id: self.id,
            author_id: self.author_id,
            board_id: self.board_id,
            board_name: self.board_name,
            category: self.category,
            fields: serde_json::from_str(&self.fields).unwrap(),
            title: self.title,
            content: self.content,
            bonds: self.bonds,
            create_time: self.create_time,
            edit_time: self.edit_time,
            anonymous: self.anonymous,
        }
    }
}
pub async fn get_all(author_id: i64) -> Fallible<Vec<Draft>> {
    let pool = get_pool();
    let drafts = sqlx::query_as!(
        _Draft,
        r#"
        SELECT
        drafts.id, drafts.author_id, drafts.board_id,
        boards.board_name,
        drafts.category as "category?",
        drafts.title,
        drafts.content,
        drafts.fields,
        drafts.create_time,
        drafts.edit_time,
        drafts.anonymous,
        drafts.bonds
        FROM drafts
        JOIN boards ON drafts.board_id = boards.id
        WHERE drafts.author_id = $1
        ORDER BY create_time DESC
        "#,
        author_id
    )
    .fetch_all(pool)
    .await?;
    Ok(drafts.into_iter().map(|d| d.to_draft()).collect())
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
