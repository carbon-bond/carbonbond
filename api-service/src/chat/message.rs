use crate::api::model::chat;
use crate::custom_error::{DataType, ErrorCode, Fallible};
use crate::db::get_pool;

pub async fn get_receiver(msg: &chat::MessageSending, id: i64) -> Fallible<i64> {
    let pool = get_pool();
    struct Users {
        user_id_1: i64,
        user_id_2: i64,
    }
    let users = sqlx::query_as!(
        Users,
        "
		SELECT user_id_1, user_id_2 FROM chat.direct_chats
        WHERE id = $1
		",
        msg.channel_id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(
        ErrorCode::NotFound(DataType::DirectChannel, "".to_owned()).context("找不到此私訊頻道"),
    )?;
    if users.user_id_1 == id {
        Ok(users.user_id_2)
    } else if users.user_id_2 == id {
        Ok(users.user_id_1)
    } else {
        Err(ErrorCode::PermissionDenied.context("您不屬於此私訊頻道"))
    }
}

// 回傳接收者的用戶 id
pub async fn send_message(msg: &chat::MessageSending, id: i64) -> Fallible<i64> {
    let receiver = get_receiver(msg, id).await?;
    let pool = get_pool();
    sqlx::query!(
        "
		INSERT INTO chat.direct_messages (direct_chat_id, sender_id, content)
		VALUES ($1, $2, $3)
		RETURNING id
		",
        msg.channel_id,
        id,
        msg.content,
    )
    .fetch_one(pool)
    .await?;
    Ok(receiver)
}
