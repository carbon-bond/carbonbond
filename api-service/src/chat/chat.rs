use super::message::_send_message;
use crate::api::model::chat::chat_model_root::server_trigger::{self, Message, Sender};
use crate::api::model::chat::chat_model_root::NewChat;
use crate::custom_error::Fallible;
use crate::db::article::get_author_by_id;
use crate::db::get_pool;
use chrono::{DateTime, Utc};
use sqlx::{self, PgConnection};

// author_id 必須是 article_id 的作者
pub async fn _create_article_chat(
    conn: &mut PgConnection,
    user_id: i64,
    author_id: i64,
    article_id: i64,
) -> Fallible<i64> {
    let (user_id_1, user_id_2) = sort_tuple((user_id, author_id));
    let chat_id = sqlx::query!(
        "
		INSERT INTO chat.direct_chats (user_id_1, user_id_2, article_id)
		VALUES ($1, $2, $3)
		RETURNING id
		",
        user_id_1,
        user_id_2,
        article_id
    )
    .fetch_one(conn)
    .await?
    .id;
    Ok(chat_id)
}

pub async fn _create_direct_chat(
    conn: &mut PgConnection,
    user_id_1: i64,
    user_id_2: i64,
) -> Fallible<i64> {
    let (user_id_1, user_id_2) = sort_tuple((user_id_1, user_id_2)); // 先排序一次以確保 user_id_1 小於 user_id_2
    let chat_id = sqlx::query!(
        "
		INSERT INTO chat.direct_chats (user_id_1, user_id_2)
		VALUES ($1, $2)
		RETURNING id
		",
        user_id_1,
        user_id_2,
    )
    .fetch_one(conn)
    .await?
    .id;
    Ok(chat_id)
}

async fn _update_direct_chat_read_time_1(
    conn: &mut PgConnection,
    chat_id: i64,
    user_id: i64,
    time: DateTime<Utc>,
) -> Fallible<()> {
    sqlx::query!(
        "
		UPDATE chat.direct_chats
        SET read_time_1 = $3
		WHERE id = $1 AND user_id_1 = $2
		",
        chat_id,
        user_id,
        time,
    )
    .execute(conn)
    .await?;
    Ok(())
}

async fn _update_direct_chat_read_time_2(
    conn: &mut PgConnection,
    chat_id: i64,
    user_id: i64,
    time: DateTime<Utc>,
) -> Fallible<()> {
    sqlx::query!(
        "
		UPDATE chat.direct_chats
        SET read_time_2 = $3
		WHERE id = $1 AND user_id_2 = $2
		",
        chat_id,
        user_id,
        time,
    )
    .execute(conn)
    .await?;
    Ok(())
}

async fn _update_direct_chat_read_time(
    conn: &mut PgConnection,
    chat_id: i64,
    user_id: i64,
    time: DateTime<Utc>,
) -> Fallible<()> {
    _update_direct_chat_read_time_1(conn, chat_id, user_id, time).await?;
    _update_direct_chat_read_time_2(conn, chat_id, user_id, time).await?;
    Ok(())
}

pub async fn update_direct_chat_read_time(
    chat_id: i64,
    user_id: i64,
    time: DateTime<Utc>,
) -> Fallible<()> {
    let mut conn = get_pool().acquire().await?;
    _update_direct_chat_read_time(&mut conn, chat_id, user_id, time).await
}

fn sort_tuple(tuple: (i64, i64)) -> (i64, i64) {
    if tuple.0 < tuple.1 {
        (tuple.0, tuple.1)
    } else {
        (tuple.1, tuple.0)
    }
}

// 回傳 (對話 id, 另一方 id)
pub async fn create_if_not_exist(
    user_id: i64,
    new_chat: NewChat,
    msg: String,
) -> Fallible<(i64, i64)> {
    let mut conn = get_pool().begin().await?;
    let (chat_id, opposite_id) = match new_chat {
        NewChat::AnonymousArticle(article_id) => {
            let author_id = get_author_by_id(article_id).await?;
            let (user_id_1, user_id_2) = sort_tuple((user_id, author_id));
            let chat_id = sqlx::query!(
                "
                SELECT id FROM chat.direct_chats
                WHERE user_id_1 = $1 AND user_id_2 = $2 AND article_id = $3
                ",
                user_id_1,
                user_id_2,
                article_id
            )
            .fetch_optional(&mut conn)
            .await?
            .map(|x| x.id);
            let chat_id = if let Some(chat_id) = chat_id {
                chat_id
            } else {
                _create_article_chat(&mut conn, user_id, author_id, article_id).await?
            };
            (chat_id, author_id)
        }
        NewChat::User(opposite_id) => {
            let (user_id_1, user_id_2) = sort_tuple((user_id, opposite_id));
            let chat_id = sqlx::query!(
                "
                SELECT id FROM chat.direct_chats
                WHERE user_id_1 = $1 AND user_id_2 = $2 AND article_id = NULL
                ",
                user_id_1,
                user_id_2,
            )
            .fetch_optional(&mut conn)
            .await?
            .map(|x| x.id);

            let chat_id = if let Some(chat_id) = chat_id {
                chat_id
            } else {
                _create_direct_chat(&mut conn, user_id_1, user_id_2).await?
            };
            (chat_id, opposite_id)
        }
    };

    _send_message(&mut conn, chat_id, user_id, &msg).await?;
    _update_direct_chat_read_time(&mut conn, chat_id, user_id, Utc::now()).await?;
    conn.commit().await?;
    Ok((chat_id, opposite_id))
}

pub async fn get_direct_chat_by_id(chat_id: i64, user_id: i64) -> Fallible<server_trigger::Chat> {
    let pool = get_pool();
    struct TmpChat {
        id: i64,
        name_1: String,
        name_2: String,
        user_id_1: i64,
        user_id_2: i64,
        read_time_1: DateTime<Utc>,
        read_time_2: DateTime<Utc>,
        sender_id: i64,
        time: DateTime<Utc>,
        text: String,
        msg_id: i64,
    }
    let chat = sqlx::query_as!(
        TmpChat,
        "
		SELECT chat.direct_chats.id,
            u1.user_name as name_1,
            u2.user_name as name_2,
            user_id_1,
            user_id_2,
            read_time_1,
            read_time_2,
            m.create_time as time,
            m.id as msg_id,
            m.content as text,
            m.sender_id as sender_id
        FROM chat.direct_chats
        JOIN users u1
        ON chat.direct_chats.user_id_1 = u1.id
        JOIN users u2
        ON chat.direct_chats.user_id_2 = u2.id
        JOIN chat.direct_messages m
        on chat.direct_chats.last_message = m.id
        WHERE chat.direct_chats.id = $1
		",
        chat_id
    )
    .fetch_one(pool)
    .await?;
    let (opposite_id, name, read_time) = if chat.user_id_1 == user_id {
        (chat.user_id_2, chat.name_2, chat.read_time_1)
    } else {
        (chat.user_id_1, chat.name_1, chat.read_time_2)
    };

    Ok(server_trigger::Chat::Direct(server_trigger::Direct {
        chat_id: chat.id,
        opposite_id,
        name,
        read_time,
        last_msg: Message {
            id: chat.msg_id,
            text: chat.text,
            sender: if chat.sender_id == user_id {
                Sender::Myself
            } else {
                Sender::Opposite
            },
            time: chat.time,
        },
    }))
}
