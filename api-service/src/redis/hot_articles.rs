use super::get_conn;
use crate::custom_error::Fallible;
use crate::db::article_statistics;
use chrono::{DateTime, Duration, NaiveDateTime, Utc};
use futures::future::join_all;
use redis::AsyncCommands;
use std::f32;
use std::time::{SystemTime, UNIX_EPOCH};

const KEY_HOT_ARTICLE: &'static str = "hot_articles";
const TOP_N: usize = 30; // 只保留前 30 名

fn compute_score(energy: f32, timestamp: u64) -> f32 {
    let z f32::max(energy, 1.0);
    z.log10() + 1.0f32 * timestamp as f32 / 45000.0f32
}

pub async fn init() -> Fallible {
    log::info!("初始化熱門文章");
    let mut conn = get_conn().await?;

    conn.del(KEY_HOT_ARTICLE).await?;

    // 從 reddit 的算式 log(z) + timestamp / 45000 來看
    // 初期註冊人數不多，我們暫時假設 z（頂 - 踩）不會大於 10000
    // 而時間項大約 2 天造成的分數就會超越 10000 頂的分數
    // 因此初始化熱門文章的時候我們只拿 2 天內的文章來計算分數做初始排名
    let articles_latest_n = article_statistics::get_latest_n_articles(TOP_N).await?;
    let articles = match articles_latest_n.last() {
        Some((_article_id, timestamp)) => {
            let datetime =
                DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(*timestamp as i64, 0), Utc);
            article_statistics::get_article_and_energy_after_a_timestamp(
                datetime - Duration::days(2),
            )
            .await?
        }
        None => {
            log::info!("資料庫中沒有文章可以用來初始化熱門文章 :(");
            Vec::new()
        }
    };

    let mut article_ranking: Vec<(f32, i64)> = Vec::new();
    for (article_id, energy, timestamp) in articles {
        article_ranking.push((compute_score(energy, timestamp), article_id));
    }
    article_ranking.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mut tasks = Vec::new();
    for (score, article_id) in article_ranking.iter().rev() {
        tasks.push(set_hot_article_score(*article_id, *score));
        if tasks.len() == TOP_N {
            break;
        }
    }
    let results = join_all(tasks).await;
    for result in results {
        result?;
    }
    Ok(())
}

pub async fn update_article_score(article_id: i64) -> Fallible {
    let mut conn = get_conn().await?;

    // update energy
    let (article_id, energy, timestamp) =
        article_statistics::get_article_and_energy_by_id(article_id).await?;
    let score = compute_score(energy, timestamp);
    log::info!(
        "更新文章人氣分數：article = {}, score = {}",
        article_id,
        score
    );

    conn.zadd(KEY_HOT_ARTICLE, article_id, score).await?;
    conn.zremrangebyrank(KEY_HOT_ARTICLE, 0, -(TOP_N as isize) - 1)
        .await?;
    Ok(())
}

pub async fn set_hot_article_score_first_time(article_id: i64) -> Fallible {
    let timestamp = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(n) => n.as_secs(),
        Err(_) => panic!("SystemTime before UNIX EPOCH!"),
    };
    let score = compute_score(0 as f32, timestamp);
    set_hot_article_score(article_id, score).await?;
    Ok(())
}

pub async fn set_hot_article_score(article_id: i64, score: f32) -> Fallible {
    let mut conn = get_conn().await?;
    log::info!(
        "設定文章人氣分數：article = {}, score = {}",
        article_id,
        score,
    );
    conn.zadd(KEY_HOT_ARTICLE, article_id, score).await?;
    conn.zremrangebyrank(KEY_HOT_ARTICLE, 0, -(TOP_N as isize) - 1)
        .await?;
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
