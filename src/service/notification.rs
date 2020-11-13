use crate::api::model::NotificationKind;
use crate::custom_error::Fallible;
use crate::db;

fn quality(kind: NotificationKind) -> Option<bool> {
    match kind {
        NotificationKind::Follow => Some(true),
        NotificationKind::Hate => Some(false),
    }
}

pub async fn create(
    user_id: i64,
    kind: NotificationKind,
    user2_id: Option<i64>,
    board_id: Option<i64>,
    article_id: Option<i64>,
) -> Fallible<i64> {
    db::notification::create(user_id, kind, quality(kind), user2_id, board_id, article_id).await
}
