use super::{get_pool, DBObject, ToFallible};
use crate::api::model::{Notification, NotificationKind};
use crate::custom_error::{DataType, ErrorCode, Fallible};

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
        kind.to_string(),
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(id)
}
