use crate::api::model::chat::chat_model_root::server_trigger::Sender;
use crate::api::model::chat::chat_model_root::{server_trigger, MessageSending};
use crate::custom_error::{DataType, ErrorCode, Fallible};
use crate::db::get_pool;
use chrono::{DateTime, Utc};
use sqlx::PgConnection;

pub async fn get_init_info(id: i64) -> Fallible<server_trigger::InitInfo> {
    let pool = get_pool();
    struct TmpChannel {
        channel_id: i64,
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
    // TODO: 多重 JOIN 可能導致效能問題
    // 參考 https://stackoverflow.com/questions/2111384/sql-join-selecting-the-last-records-in-a-one-to-many-relationship
    let channels = sqlx::query_as!(
        TmpChannel,
        "
		SELECT chat.direct_chats.id as channel_id,
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
        WHERE (user_id_1 = $1 OR user_id_2 = $1)
		",
        id
    )
    .fetch_all(pool)
    .await?;
    let channels: Vec<server_trigger::Channel> = channels
        .into_iter()
        .map(|tmp| {
            let (name, opposite_id, read_time) = if tmp.user_id_1 == id {
                (tmp.name_2.clone(), tmp.user_id_2, tmp.read_time_1)
            } else {
                (tmp.name_1.clone(), tmp.user_id_1, tmp.read_time_2)
            };
            let sender = if id == tmp.sender_id {
                Sender::Myself
            } else {
                Sender::Opposite
            };
            server_trigger::Channel::Direct(server_trigger::Direct {
                channel_id: tmp.channel_id,
                name,
                opposite_id,
                read_time,
                last_msg: server_trigger::Message {
                    id: tmp.msg_id,
                    sender,
                    text: tmp.text,
                    time: tmp.time,
                },
            })
        })
        .collect();
    Ok(server_trigger::InitInfo { channels })
}
pub async fn get_receiver(chat_id: i64, id: i64) -> Fallible<i64> {
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
        chat_id
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
pub async fn _update_last_message(
    conn: &mut PgConnection,
    chat_id: i64,
    message_id: i64,
) -> Fallible<()> {
    sqlx::query!(
        "
        UPDATE chat.direct_chats
        SET last_message = $1
        WHERE id = $2
		",
        message_id,
        chat_id,
    )
    .execute(conn)
    .await?;
    Ok(())
}

pub async fn _save_message(
    conn: &mut PgConnection,
    chat_id: i64,
    sneder_id: i64,
    msg: &String,
) -> Fallible<i64> {
    let id = sqlx::query!(
        "
		INSERT INTO chat.direct_messages (direct_chat_id, sender_id, content)
		VALUES ($1, $2, $3)
		RETURNING id
		",
        chat_id,
        sneder_id,
        msg,
    )
    .fetch_one(conn)
    .await?
    .id;
    Ok(id)
}

// 回傳訊息的 id
pub async fn _send_message(
    conn: &mut PgConnection,
    chat_id: i64,
    sneder_id: i64,
    msg: &String,
) -> Fallible<i64> {
    let message_id = _save_message(conn, chat_id, sneder_id, msg).await?;
    _update_last_message(conn, chat_id, message_id).await?;
    Ok(message_id)
}

// 回傳接收者的用戶 id
pub async fn send_message(msg: &MessageSending, my_id: i64) -> Fallible<i64> {
    let mut pool = get_pool().acquire().await?;
    let receiver = get_receiver(msg.channel_id, my_id).await?;
    _send_message(&mut pool, msg.channel_id, my_id, &msg.content).await?;
    Ok(receiver)
}

pub async fn get_direct_chat_history(
    my_id: i64,
    chat_id: i64,
    last_msg_id: i64,
    number: i64,
) -> Fallible<Vec<server_trigger::Message>> {
    get_receiver(chat_id, my_id).await?; // 確認權限
    let pool = get_pool();
    let messages = sqlx::query!(
        "
        SELECT id, content, create_time, sender_id from chat.direct_messages
        WHERE id < $1 AND direct_chat_id = $2
        ORDER BY create_time
        limit $3
        ",
        last_msg_id,
        chat_id,
        number,
    )
    .fetch_all(pool)
    .await?;
    Ok(messages
        .into_iter()
        .map(|msg| server_trigger::Message {
            text: msg.content,
            id: msg.id,
            sender: if my_id == msg.sender_id {
                Sender::Myself
            } else {
                Sender::Opposite
            },
            time: msg.create_time,
        })
        .collect())
}
