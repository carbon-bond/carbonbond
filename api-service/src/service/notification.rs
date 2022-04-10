use crate::api::model::forum::force::Bond;
use crate::api::model::forum::NotificationKind;
use crate::custom_error::Fallible;
use crate::db;
use crate::db::article::get_meta_by_id;

fn quality(kind: NotificationKind) -> Option<bool> {
    match kind {
        NotificationKind::Follow => Some(true),
        NotificationKind::Hate => Some(false),
        NotificationKind::ArticleReplied => None,
        NotificationKind::ArticleGoodReplied => Some(true),
        NotificationKind::ArticleBadReplied => Some(false),
        NotificationKind::CommentReplied => None,
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

async fn handle_reply(
    author_id: i64,
    board_id: i64,
    reply_id: Option<i64>,    // 回文 id
    original_article_id: i64, // 原文 id
    anonymous: bool,
    kind: NotificationKind,
) -> Fallible {
    let target_author = db::article::get_author_by_id(original_article_id).await?;
    if target_author == author_id {
        log::debug!(
            "回應同作者 {} 的文章 {} 不發通知",
            author_id,
            original_article_id
        );
        return Ok(());
    }
    // TODO: 設置鍵能
    // TODO: 記錄鍵結的標籤，讓前端可以顯示
    create(
        target_author,
        kind,
        if anonymous { None } else { Some(author_id) },
        Some(board_id),
        Some(target_author),
        reply_id,
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
        handle_reply(
            author_id,
            board_id,
            Some(reply_id),
            bond.to,
            anonymous,
            NotificationKind::ArticleReplied,
        )
        .await?;
    }

    Ok(())
}

pub async fn handle_comment(author_id: i64, article_id: i64) -> Fallible {
    let board_id = get_meta_by_id(article_id, None).await?.board_id;
    handle_reply(
        author_id,
        board_id,
        None,
        article_id,
        false, // TODO: 支援匿名留言
        NotificationKind::CommentReplied,
    )
    .await
}
