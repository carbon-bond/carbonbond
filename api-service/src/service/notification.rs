use crate::api::model::forum::force::Bond;
use crate::api::model::forum::NotificationKind;
use crate::custom_error::Fallible;
use crate::db;

fn quality(kind: NotificationKind) -> Option<bool> {
    match kind {
        NotificationKind::Follow => Some(true),
        NotificationKind::Hate => Some(false),
        NotificationKind::ArticleReplied => None,
        NotificationKind::ArticleGoodReplied => Some(true),
        NotificationKind::ArticleBadReplied => Some(false),
    }
}

pub async fn create(
    user_id: i64,
    kind: NotificationKind,
    user2_id: Option<i64>,
    board_id: Option<i64>,
    article1_id: Option<i64>,
    article2_id: Option<i64>,
) -> Fallible<i64> {
    db::notification::create(
        user_id,
        kind,
        quality(kind),
        user2_id,
        board_id,
        article1_id,
        article2_id,
    )
    .await
}

async fn handle_bond(
    author_id: i64,
    board_id: i64,
    reply_id: i64,
    bond: &Bond,
    anonymous: bool,
) -> Fallible {
    let target_author = db::article::get_author_by_id(bond.to).await?;
    if target_author == author_id {
        log::debug!(
            "同作者 {} 的文章 {} -> {} 不發通知",
            author_id,
            reply_id,
            target_author
        );
        return Ok(());
    }
    // TODO: 設置鍵能
    // TODO: 記錄鍵結的標籤，讓前端可以顯示
    create(
        target_author,
        NotificationKind::ArticleReplied,
        if anonymous { None } else { Some(author_id) },
        Some(board_id),
        Some(target_author),
        Some(reply_id),
    )
    .await?;
    Ok(())
}
pub async fn handle_article(
    author_id: i64,
    board_id: i64,
    reply_id: i64,
    bonds: &Vec<Bond>,
    anonymous: bool,
) -> Fallible {
    for bond in bonds {
        handle_bond(author_id, board_id, reply_id, bond, anonymous).await?;
    }

    Ok(())
}
