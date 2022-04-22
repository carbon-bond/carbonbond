use crate::custom_error::{Fallible};
use state::Storage;
use std::collections::HashMap;
use std::collections::VecDeque;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

static BOARD_ARTICLE_NUMBER_IN_24H: Storage<Mutex<HashMap<i64, i64>>> = Storage::new();
static ARTICLE_RECORD_IN_24H: Storage<Mutex<VecDeque<(i64, u64)>>> = Storage::new();

const MAX_HOT_BOARDS: usize = 30;
const ARTICLE_NUMBER_LIFETIME: u64 = 86400; // 只保留一天內的文章數

pub async fn init() -> Fallible<()> {
    log::debug!("初始化熱門看板統計資料");
    // FIXME: load article in past 24h from database
    let initial_map = HashMap::new();
    assert!(BOARD_ARTICLE_NUMBER_IN_24H.set(Mutex::new(initial_map)), "初始化熱門看板 hashMap 錯誤",);
    let initial_deque = VecDeque::new();
    assert!(ARTICLE_RECORD_IN_24H.set(Mutex::new(initial_deque)), "初始化熱門看板 VecDeque 錯誤",);
    log::debug!("初始化熱門看板統計資料完畢");
    Ok(())
}

fn get_current_timestamp() -> u64{
    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    since_the_epoch.as_secs() as u64
}

pub async fn add_hot_board_article_number(board_id: i64, article_id: i64) -> Fallible<()> {
    log::debug!("看板 #{} 新增文章 #{}，文章數 + 1", board_id, article_id);
    let mut board_article_number = BOARD_ARTICLE_NUMBER_IN_24H.get().lock().unwrap();
    let mut article_record = ARTICLE_RECORD_IN_24H.get().lock().unwrap();
    *board_article_number.entry(board_id).or_insert(0) += 1;
    article_record.push_back((board_id, get_current_timestamp()));
    Ok(())
}

pub async fn get_board_pop(board_id: i64) -> Fallible<i64> {
    log::trace!("查詢 #{} 看板人氣", board_id);
    let mut board_article_number = BOARD_ARTICLE_NUMBER_IN_24H.get().lock().unwrap();
    board_article_number.entry(board_id).or_insert(0);
    let pop: i64 = *board_article_number.get(&board_id).unwrap();
    Ok(pop)
}

pub async fn get_hot_boards() -> Fallible<Vec<i64>> {
    log::debug!("開始更新看板文章數統計資料");
    let mut board_article_number = BOARD_ARTICLE_NUMBER_IN_24H.get().lock().unwrap();
    let mut article_record = ARTICLE_RECORD_IN_24H.get().lock().unwrap();
    let current_timestamp = get_current_timestamp();
    while !article_record.is_empty() {
        let (board_id, timestamp) = article_record.get(0).unwrap();
        if timestamp > &(current_timestamp - ARTICLE_NUMBER_LIFETIME) {
            break;
        }
        if let Some(article_number) = board_article_number.get_mut(&board_id) {
            *article_number -= 1;
        }
        article_record.pop_front();
    }
    let mut board_article_numbers: Vec<(&i64, &i64)> = board_article_number.iter().collect();
    board_article_numbers.sort_by(|lhs, rhs| { rhs.1.cmp(lhs.1)});
    let mut hot_boards = Vec::new();
    for board_article_number in board_article_numbers.iter().rev() {
        hot_boards.push(board_article_number.0.clone());
        if hot_boards.len() >= MAX_HOT_BOARDS {
            break;
        }
    }
    log::debug!("結束更新看板文章數統計資料");
    Ok(hot_boards)
}
