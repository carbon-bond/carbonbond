use super::{get_pool, DBObject, ToFallible};
use crate::api::model::{Notification, NotificationKind};
use crate::custom_error::{DataType, ErrorCode, Fallible};
use std::str::FromStr;
use std::string::ToString;

impl DBObject for Notification {
    const TYPE: DataType = DataType::Notification;
}

pub async fn create(
    user_id: i64,
    kind: NotificationKind,
    user2_id: Option<i64>,
    board_id: Option<i64>,
    article_id: Option<i64>,
) -> Fallible<i64> {
    let pool = get_pool();
    let id = sqlx::query!(
        "
        INSERT INTO notifications (user_id, user2_id, board_id, article_id, kind)
        VALUES ($1, $2, $3, $4, $5::text::notification_kind)
        RETURNING id
        ",
        user_id,
        user2_id,
        board_id,
        article_id,
        kind.to_string()
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(id)
}

pub async fn get_by_user(user_id: i64, all: bool) -> Fallible<Vec<Notification>> {
    let pool = get_pool();
    // XXX: 一旦 sqlx 自訂型別進化就改掉這段
    use chrono::{DateTime, Utc};
    pub struct DBNotification {
        pub id: i64,
        pub kind: String,
        pub user_id: i64,
        pub read: bool,
        pub create_time: DateTime<Utc>,
        pub board_name: Option<String>,
        pub board_id: Option<i64>,
        pub user2_name: Option<String>,
        pub user2_id: Option<i64>,
        pub article_title: Option<String>,
        pub article_id: Option<i64>,
    }
    let notifications = sqlx::query_as_unchecked!(
        DBNotification,
        "
        SELECT n.*, users.user_name as user2_name, boards.board_name, articles.title as article_title
        FROM notifications n
        LEFT JOIN users on n.user2_id = users.id
        LEFT JOIN boards on n.board_id = boards.id
        LEFT JOIN articles on n.article_id = articles.id
        WHERE user_id = $1 AND ($2 OR NOT n.read)
        ",
        user_id,
        all,
    )
    .fetch_all(pool)
    .await?;
    notifications
        .into_iter()
        .map(|n| -> Fallible<Notification> {
            Ok(Notification {
                id: n.id,
                kind: NotificationKind::from_str(&n.kind)?,
                user_id: n.user_id,
                read: n.read,
                create_time: n.create_time,
                board_name: n.board_name,
                board_id: n.board_id,
                user2_name: n.user2_name,
                user2_id: n.user2_id,
                article_title: n.article_title,
                article_id: n.article_id,
            })
        })
        .collect()
}

pub async fn read(id: i64, user_id: i64) -> Fallible {
    let pool = get_pool();
    sqlx::query!(
        "
        UPDATE notifications SET read = true
        WHERE id = $1 AND user_id = $2
        ",
        id,
        user_id
    )
    .execute(pool)
    .await?;
    Ok(())
}
