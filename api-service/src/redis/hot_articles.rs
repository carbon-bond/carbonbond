use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;
use std::cmp;
use std::f32;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::db::article_statistics;

const KEY_HOT_ARTICLE: &'static str = "hot_articles";
const TOP_N: usize = 30; // 只保留前 30 名

pub async fn init() -> Fallible {
    log::info!("初始化熱門文章");
    let mut conn = get_conn().await?;

    conn.del(KEY_HOT_ARTICLE).await?;

    let articles_in_top_n = article_statistics::get_all_articles_in_latest_n(TOP_N).await?;
    for (article_id, timestamp) in articles_in_top_n {
        set_hot_article_score_with_timestamp(article_id, timestamp).await?;
    }

    Ok(())
}

pub async fn modify_article_energy(article_id: i64, energy_old: i16, energy_diff: i16) -> Fallible {
    let mut conn = get_conn().await?;

    // update energy
    let energy_new = energy_old + energy_diff;
    log::info!(
        "更新文章鍵能：article={}, energy_diff={}, energy_old={}, energy_new={}",
        article_id,
        energy_diff,
        energy_old,
        energy_new
    );

    // update score
    let z_old = cmp::max(energy_old, 1);
    let z_new = cmp::max(energy_new, 1);
    let z_old = z_old as f32;
    let z_new = z_new as f32;
    let timestamp = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(n) => n.as_secs(),
        Err(_) => panic!("SystemTime before UNIX EPOCH!"),
    };
    let z = 1.0f32; // 推 - 噓, 最低 1
    let score_default = z.log10() + 1.0f32 * timestamp as f32 / 45000.0f32;
    let score_old = conn
        .zscore(KEY_HOT_ARTICLE, article_id)
        .await
        .unwrap_or(score_default);
    let score_new = score_old - z_old.log10() + z_new.log10();
    log::info!(
        "更新文章人氣分數：article={}, score_old={}, score_new={}",
        article_id,
        score_old,
        score_new
    );

    conn.zadd(KEY_HOT_ARTICLE, article_id, score_new).await?;
    conn.zremrangebyrank(KEY_HOT_ARTICLE, 0, -(TOP_N as isize) - 1).await?;
    Ok(())
}

pub async fn set_hot_article_score(article_id: i64) -> Fallible {
    let timestamp = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(n) => n.as_secs(),
        Err(_) => panic!("SystemTime before UNIX EPOCH!"),
    };
    set_hot_article_score_with_timestamp(article_id, timestamp).await?;
    Ok(())
}

pub async fn set_hot_article_score_with_timestamp(article_id: i64, timestamp: u64) -> Fallible {
    // formula from reddit
    let z = 1.0f32; // 推 - 噓, 最低 1
    let score = z.log10() + 1.0f32 * timestamp as f32 / 45000.0f32;

    log::info!(
        "設定文章人氣分數：article={}, score={}, timestamp={}",
        article_id,
        score,
        timestamp
    );

    let mut conn = get_conn().await?;
    conn.zadd(KEY_HOT_ARTICLE, article_id, score).await?;
    conn.zremrangebyrank(KEY_HOT_ARTICLE, 0, -(TOP_N as isize) - 1).await?;
    Ok(())
}

pub async fn get_hot_articles() -> Fallible<Vec<i64>> {
    log::info!("查詢熱門文章");
    let mut conn = get_conn().await?;

    let mut article_ids: Vec<i64> = Vec::new();
    if !conn.exists(KEY_HOT_ARTICLE).await? {
        log::info!("目前資料庫中沒有熱門文章 :(");
    } else {
        article_ids = conn
            .zrevrange(KEY_HOT_ARTICLE, 0, TOP_N as isize)
            .await
            .unwrap_or_default();
    }
    Ok(article_ids)
}
