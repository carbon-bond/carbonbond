use crate::config;
use super::get_conn;
use crate::custom_error::Fallible;
use redis::AsyncCommands;
use redis;
use std::format;
use std::time::{SystemTime, UNIX_EPOCH};

const KEY_BOARD_HOT_POINT: &'static str = "board_article_number_in_24h";
const KEY_ARTICLE_SET: &'static str = "new_article_in_24h";
const TOP_N_BOARD: isize = 30; // 只保留前 30 名
const HOT_POINT_LIFETIME: u64 = 86400; // 只保留一天內的文章數

fn get_current_timestamp() -> u64{
    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    since_the_epoch.as_secs() as u64
}

pub async fn add_hot_board_point(board_id: i64, article_id: i64) -> Fallible {
    log::info!("看板 {} 分數 + 1", board_id);
    let mut conn = get_conn().await?;
    let current_timestamp = get_current_timestamp();
    conn.zadd(KEY_ARTICLE_SET, format!("{}_{}", board_id, article_id), current_timestamp).await?;
    conn.zincr(KEY_BOARD_HOT_POINT, board_id, 1).await?;
    Ok(())
}

pub async fn get_hot_boards() -> Fallible<Vec<i64>> {
    log::info!("查詢熱門看板");
    let conf = config::get_config();
    let mut conn = redis::Client::open(&*conf.redis.host)
            .expect("Invalid connection URL")
            .get_connection()
            .expect("Failed to connect to redis");
    let mut is_success = false;
    let expire_timestamp= get_current_timestamp() - HOT_POINT_LIFETIME;
    for retry in 0..3 {
        match redis::cmd("WATCH").arg(KEY_BOARD_HOT_POINT).query(&mut conn) {
            Ok(()) => (),
            Err(_) => {
                log::info!("更新 24h 內文章之 Redis WATCH 操作失敗, retry = {}", retry);
                continue;
            }
        }
        match redis::cmd("WATCH").arg(KEY_ARTICLE_SET).query(&mut conn) {
            Ok(()) => (),
            Err(_) => {
                log::info!("更新 24h 內文章之 Redis WATCH 操作失敗, retry = {}", retry);
                continue;
            }
        }
        let old_articles: Vec<String> = redis::cmd("ZRANGEBYSCORE")
                .arg(KEY_ARTICLE_SET)
                .arg(0)
                .arg(expire_timestamp)
                .query(&mut conn)
                .unwrap_or(Vec::new());
        match redis::cmd("MULTI").query(&mut conn) {
            Ok(()) => (),
            Err(_) => {
                log::info!("更新 24h 內文章之 Redis MULTI 操作失敗, retry = {}", retry);
                continue;
            }
        }
        for board_and_article in old_articles.iter() {
            let split: Vec<&str> = board_and_article.split("_").collect();
            let _: () = redis::cmd("ZINCRBY")
                    .arg(KEY_BOARD_HOT_POINT)
                    .arg(-1)
                    .arg(split[0])
                    .query(&mut conn)
                    .unwrap_or(());
        }
        let _: () = redis::cmd("ZREMRANGEBYSCORE")
                .arg(KEY_ARTICLE_SET)
                .arg(0)
                .arg(expire_timestamp)
                .query(&mut conn)
                .unwrap_or(());
        match redis::cmd("EXEC").query(&mut conn) {
            Ok(()) => {
                is_success = true;
                break;
            },
            Err(_) => log::info!("更新 24h 內文章之 Redis EXEC 操作失敗, retry = {}", retry),
        }
    }
    if is_success {
        log::info!("更新熱門看板排行成功, expire_timestamp {}", expire_timestamp);
    } else {
        log::info!("更新熱門看板排行失敗, expire_timestamp {}", expire_timestamp);
    }
    let hot_boards = redis::cmd("ZREVRANGE")
            .arg(KEY_BOARD_HOT_POINT)
            .arg(0)
            .arg(TOP_N_BOARD - 1)
            .query(&mut conn)
            .unwrap_or(Vec::new());
    Ok(hot_boards)
}
