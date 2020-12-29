use crate::api::model::NotificationKind;
use crate::custom_error::{ErrorCode, Fallible};
use crate::db;
use force::instance_defs::Bond as BondInstance;
use force::parse_category;
use serde_json::{Map, Value};
use std::collections::HashMap;

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
    replier_id: i64,
    board_id: i64,
    reply_id: i64,
    bond: BondInstance,
) -> Fallible {
    let target = db::article::get_meta_by_id(bond.target_article).await?;
    if target.author_id == replier_id {
        log::debug!(
            "同作者 {} 的文章 {} -> {} 不發通知",
            replier_id,
            reply_id,
            target.id
        );
        return Ok(());
    }
    let kind = if bond.energy > 0 {
        NotificationKind::ArticleGoodReplied
    } else if bond.energy < 0 {
        NotificationKind::ArticleBadReplied
    } else {
        NotificationKind::ArticleReplied
    };
    create(
        target.author_id,
        kind,
        Some(replier_id),
        Some(board_id),
        Some(target.id),
        Some(reply_id),
    )
    .await?;
    Ok(())
}
pub async fn handle_article(
    replier_id: i64,
    board_id: i64,
    reply_id: i64,
    category_name: &str,
    content: String,
) -> Fallible {
    let mut content: Map<String, Value> = serde_json::from_str(&content).map_err(|err| {
        ErrorCode::ParsingJson
            .context("文章內容反序列化失敗")
            .context(err)
    })?;
    let category = db::article::get_newest_category(board_id, category_name).await?;
    let category = parse_category(&category.source)?;

    let mut mem = HashMap::<i64, ()>::new();
    macro_rules! handle {
        ($value:expr) => {
            let bond: BondInstance = serde_json::from_value($value).map_err(|err| {
                ErrorCode::ParsingJson
                    .context("鍵結反序列化失敗")
                    .context(err)
            })?;
            let entry = mem.entry(bond.target_article);
            match entry {
                std::collections::hash_map::Entry::Vacant(e) => {
                    e.insert(());
                    handle_bond(replier_id, board_id, reply_id, bond).await?;
                }
                _ => (),
            }
        };
    }

    use force::BasicDataType::*;
    use force::DataType::*;
    for field in category.fields.iter() {
        // XXX: 如果使用者搞出一個有撞名欄位的分類，這裡的 unwrap 就會爆掉
        let value = content.remove(&field.name).unwrap();
        match field.datatype {
            Optional(Bond(_)) | Single(Bond(_)) => {
                handle!(value);
            }
            Array { t: Bond(_), .. } => match value {
                Value::Array(values) => {
                    for value in values {
                        handle!(value);
                    }
                }
                _ => {}
            },
            _ => {}
        }
    }
    Ok(())
}
