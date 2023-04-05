use super::{get_pool, DBObject};
use crate::api::model::forum::{BoardType, Notification, NotificationKind};
use crate::custom_error::{DataType, Fallible};
use std::str::FromStr;

impl DBObject for Notification {
    const TYPE: DataType = DataType::Notification;
}

pub async fn create(
    user_id: i64,
    kind: NotificationKind,
    quality: Option<bool>,
    user2_id: Option<i64>,
    board_id: Option<i64>,
    article1_id: Option<i64>,
    article2_id: Option<i64>,
) -> Fallible<i64> {
    let pool = get_pool();
    let id = sqlx::query!(
        "
        INSERT INTO notifications (user_id, user2_id, board_id, article1_id, article2_id, kind, quality)
        VALUES ($1, $2, $3, $4, $5, $6::text::notification_kind, $7)
        RETURNING id
        ",
        user_id,
        user2_id,
        board_id,
        article1_id,
        article2_id,
        kind.to_string(),
        quality
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(id)
}

// NOTE: 若一篇文章有 n 個人留言，需通知 n 個人。若 n 巨大，可能帶給伺服器壓力
pub async fn notify_all_commenter(
    author_id: i64,
    article_id: i64,
    board_id: i64,
    anonymous: bool,
) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "
        INSERT INTO notifications
            (user_id, user2_id, board_id, article1_id, article2_id, kind, quality)
        SELECT
            comments.author_id as user_id,
            $5 as user2_id,
            $3 as board_id,
            $1 as article1_id,
            NULL as article2_id,
            $4::text::notification_kind as kind,
            NULL as quality
        FROM
            articles
        JOIN
            comments
        ON
            articles.id = comments.article_id
        WHERE
            articles.id = $1
        AND
            comments.author_id <> $2
        AND
            comments.author_id <> articles.author_id
        GROUP BY
            comments.author_id
        ",
        article_id,
        author_id,
        board_id,
        NotificationKind::OtherCommentReplied.to_string(),
        if anonymous { None } else { Some(author_id) },
    )
    .execute(pool)
    .await?;
    Ok(())
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
        pub quality: Option<bool>,
        pub create_time: DateTime<Utc>,
        pub board_name: Option<String>,
        pub board_type: Option<String>,
        pub board_id: Option<i64>,
        pub user2_name: Option<String>,
        pub user2_id: Option<i64>,
        pub article1_title: Option<String>,
        pub article1_id: Option<i64>,
        pub article2_title: Option<String>,
        pub article2_id: Option<i64>,
    }
    let notifications = sqlx::query_as_unchecked!(
        DBNotification,
        "
        SELECT n.*, users.user_name as user2_name, boards.board_name, boards.board_type, a1.title as article1_title, a2.title as article2_title
        FROM notifications n
        LEFT JOIN users on n.user2_id = users.id
        LEFT JOIN boards on n.board_id = boards.id
        LEFT JOIN articles a1 on n.article1_id = a1.id
        LEFT JOIN articles a2 on n.article2_id = a2.id
        WHERE user_id = $1 AND ($2 OR NOT n.read)
        ORDER BY n.create_time DESC
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
                quality: n.quality,
                create_time: n.create_time,
                board_name: n.board_name,
                board_type: if n.board_type == None {
                    None
                } else {
                    Some(BoardType::from_str(&n.board_type.unwrap())?)
                },
                board_id: n.board_id,
                user2_name: n.user2_name,
                user2_id: n.user2_id,
                article1_title: n.article1_title,
                article2_title: n.article2_title,
                article1_id: n.article1_id,
                article2_id: n.article2_id,
            })
        })
        .collect()
}

pub async fn notify_mentioned_id(
    author_id: i64,
    article_id: i64,
    board_id: i64,
    anonymous: bool,
    mentioned_ids: &Vec<i64>,
) -> Fallible {
    // TODO: 用類似 Promise.all 的方式平行化
    for mentioned_id in mentioned_ids {
        create(
            *mentioned_id,
            NotificationKind::MentionedInComment,
            None,
            if anonymous { None } else { Some(author_id) },
            Some(board_id),
            Some(article_id),
            None,
        )
        .await?;
    }
    Ok(())
}

pub async fn read(ids: &[i64], user_id: i64) -> Fallible {
    let pool = get_pool();
    sqlx::query!(
        "
        UPDATE notifications SET read = true
        WHERE id = ANY($1) AND user_id = $2
        ",
        ids,
        user_id
    )
    .execute(pool)
    .await?;
    Ok(())
}
