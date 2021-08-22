use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;
use std::collections::HashMap;
use std::f32;
use std::time::{SystemTime, UNIX_EPOCH};

const KEY: &'static str = "hot_articles";

pub async fn set_hot_article_score(article_id: i64) -> Fallible {
    let timestamp = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(n) => n.as_secs(),
        Err(_) => panic!("SystemTime before UNIX EPOCH!"),
    };

    // formula from reddit
    let z = 1.0f32; // 推 - 噓, 最低 1
    let score = z.log10() + 1.0f32 * timestamp as f32 / 45000.0f32;

    log::info!("更新文章人氣分數：article={}, score={}", article_id, score);

    let mut conn = get_conn().await?;
    conn.zadd(KEY, article_id, score).await?;
    conn.zremrangebyrank(KEY, 0, -51).await?;
    Ok(())
}

pub async fn get_hot_articles() -> Fallible<Vec<i64>> {
    log::info!("查詢熱門文章");
    let mut conn = get_conn().await?;

    if !conn.exists(KEY).await? {
        log::info!("目前資料庫中沒有熱門文章 :(");
        let hot_articles: Vec<i64> = Vec::new();
        Ok(hot_articles)
    } else {
        let map: HashMap<i64, i64> = conn.zrevrange(KEY, 0, 49).await.unwrap_or_default();

        let mut hash_vec: Vec<_> = map.iter().collect();
        hash_vec.sort_by(|a, b| b.1.cmp(a.1));

        let hot_articles = hash_vec.iter().map(|&x| x.0).collect::<Vec<_>>();

        let hot_articles_value = hot_articles.into_iter().cloned().collect();

        Ok(hot_articles_value)
    }
}
