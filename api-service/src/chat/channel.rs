use super::message::_send_message;
use crate::custom_error::Fallible;
use crate::db::get_pool;
use sqlx::{self, PgConnection};

pub async fn _create_direct_chat(
    conn: &mut PgConnection,
    user_id_1: i64,
    user_id_2: i64,
) -> Fallible<i64> {
    let pool = get_pool();
    let chat_id = sqlx::query!(
        "
		INSERT INTO chat.direct_chats (user_id_1, user_id_2)
		VALUES ($1, $2)
		RETURNING id
		",
        user_id_1,
        user_id_2,
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(chat_id)
}

pub async fn create_if_not_exist(user_id: i64, opposite_id: i64, msg: String) -> Fallible<i64> {
    let mut conn = get_pool().begin().await?;
    let user_id_1 = if user_id < opposite_id {
        user_id
    } else {
        opposite_id
    };
    let user_id_2 = if user_id < opposite_id {
        opposite_id
    } else {
        user_id
    };
    let chat_id = sqlx::query!(
        "
		SELECT id FROM chat.direct_chats
        WHERE user_id_1 = $1 AND user_id_2 = $2
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
    _send_message(&mut conn, chat_id, user_id, &msg).await?;
    conn.commit().await?;
    Ok(chat_id)
}
