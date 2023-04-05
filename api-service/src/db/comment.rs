use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::get_pool;
use crate::api::model::forum::{Author, Comment};
use crate::custom_error::{DataType, ErrorCode, Fallible};

pub async fn get_by_article_id(article_id: i64, viewer_id: Option<i64>) -> Fallible<Vec<Comment>> {
    let pool = get_pool();
    let comments = sqlx::query!(
        r#"
        SELECT
            comments.id, comments.author_id, users.user_name, comments.create_time, comments.content, comments.anonymous
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
            author: if comment.anonymous && viewer_id == Some(comment.author_id) {
                Author::MyAnonymous
            } else if comment.anonymous {
                Author::Anonymous
            } else {
                Author::NamedAuthor {
                    name: comment.user_name,
                    id: comment.author_id,
                }
            },
            content: comment.content,
            create_time: comment.create_time,
        })
        .collect();

    Ok(comments)
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(untagged)]
enum Node {
    Text {
        text: String,
    },
    Mention {
        kind: String,
        username: String,
        children: Vec<Node>, // children 無用途，僅爲了滿足 slate 的型別
    },
    Paragraph {
        kind: String,
        children: Vec<Node>,
    },
}

impl Node {
    fn to_string(self) -> String {
        match self {
            Node::Text { text } => text,
            Node::Mention {
                kind: _,
                username,
                children: _,
            } => {
                format!("@{}", username)
            }
            Node::Paragraph { kind: _, children } => children
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<String>>()
                .join("/n"),
        }
    }
}

fn get_mentioned_users(nodes: &Vec<Node>) -> Vec<String> {
    let mut usernames: Vec<String> = Vec::new();
    for node in nodes {
        match node {
            Node::Mention {
                kind: _,
                username,
                children: _,
            } => {
                usernames.push(username.clone());
            }
            Node::Paragraph { kind: _, children } => {
                let mut accounts_in_children = get_mentioned_users(children);
                usernames.append(&mut accounts_in_children);
            }
            _ => {}
        }
    }
    return usernames;
}

struct User {
    id: i64,
    user_name: String,
}

fn get_plain_text(nodes: Vec<Node>) -> String {
    nodes
        .into_iter()
        .map(|c| c.to_string())
        .collect::<Vec<String>>()
        .join("/n")
}

// 回傳 (留言ID, 提及的帳號, 純文字化的留言內容)
pub async fn create(
    author_id: i64,
    article_id: i64,
    content: &String,
    anonymous: bool,
) -> Fallible<(i64, Vec<i64>, String)> {
    let pool = get_pool();

    let rich_text_comment: Vec<Node> = serde_json::from_str(content)?;
    let mentioned_users = get_mentioned_users(&rich_text_comment);

    let users: HashMap<String, i64> = sqlx::query_as!(
        User,
        "
        SELECT id, user_name from users
        WHERE user_name = ANY($1)
    ",
        &mentioned_users
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|r| (r.user_name, r.id))
    .collect();

    let mut mentioned_ids: Vec<i64> = Vec::new();

    for name in &mentioned_users {
        match users.get(name) {
            Some(id) => {
                mentioned_ids.push(*id);
            }
            None => {
                return Err(ErrorCode::NotFound(DataType::User, name.to_owned()).into());
            }
        }
    }

    let comment_id = sqlx::query!(
        "
        INSERT INTO comments (author_id, article_id, content, anonymous)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        ",
        author_id,
        article_id,
        content,
        anonymous
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok((comment_id, mentioned_ids, get_plain_text(rich_text_comment)))
}
