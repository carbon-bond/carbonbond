use crate::{api::model::ArticleDigest, custom_error::Fallible};
use force::{
    instance_defs::Bond as BondInstance,
    BasicDataType::{self, *},
    Category,
};
use serde_json::{Map, Value};

const MAX_TXT: usize = 200;
const BOND_EQUIVILENT_TXT_COUNT: usize = 101; // 因為顯示鍵結很佔空間，把它算成多個字

#[derive(Debug)]
struct Buff {
    max_txt: usize,
    nonblock_txt_count: usize,
    block_txt_count: usize,
    nonblock_buff: Map<String, Value>,
    block_buff: Map<String, Value>,
    truncated: bool,
}
impl Buff {
    fn new() -> Self {
        Buff {
            max_txt: MAX_TXT,
            nonblock_txt_count: 0,
            block_txt_count: 0,
            nonblock_buff: Default::default(),
            block_buff: Default::default(),
            truncated: false,
        }
    }
    fn has_block(&self) -> bool {
        self.block_txt_count > 0
    }
    fn txt_count(&self) -> usize {
        if self.has_block() {
            self.block_txt_count
        } else {
            self.nonblock_txt_count
        }
    }
    fn is_done(&self) -> bool {
        self.txt_count() >= self.max_txt
    }
    fn incr_and_truncate(&mut self, is_block: bool, value: &mut Value) {
        macro_rules! truncate {
            ($s:expr, $count:expr) => {
                let diff = self.max_txt - $count;
                if diff <= 0 {
                    return;
                }
                match $s.char_indices().nth(diff) {
                    None => (),
                    Some((idx, _)) => {
                        $s.truncate(idx);
                    }
                }
                $count += $s.chars().count();
            };
        }
        match value {
            Value::String(s) => {
                if is_block {
                    truncate!(s, self.block_txt_count);
                } else {
                    truncate!(s, self.nonblock_txt_count);
                }
            }
            Value::Number(_) | Value::Bool(_) => {
                self.nonblock_txt_count += 1;
            }
            _ => {
                // XXX: 錯誤處理，或改用強型別鍵結
                let bond: BondInstance = serde_json::from_value(value.clone()).unwrap();
                // TODO: 處理籤？
                // log::warn!("未知的型別 {}", value);
                self.block_txt_count += BOND_EQUIVILENT_TXT_COUNT;
            }
        }
        if self.is_done() {
            self.truncated = true;
        }
    }
    /// (is_block, in_digest)
    /// - is_block 為真代表區塊欄位
    /// - in_digest 為真代表該欄位要進到摘要裡
    fn pre_insert(&self, ty: &BasicDataType) -> Option<(bool, bool)> {
        let (is_block, in_digest) = match ty {
            Text(_) => (true, true),
            Bond(_) => (true, false),
            _ => (false, true),
        };
        if !is_block && self.has_block() {
            return None;
        }
        Some((is_block, in_digest))
    }
    fn insert_arr(&mut self, ty: &BasicDataType, name: String, mut arr: Vec<Value>) {
        let (is_block, in_digest) = match self.pre_insert(ty) {
            Some(t) => t,
            None => return,
        };
        for v in arr.iter_mut() {
            self.incr_and_truncate(is_block, v);
        }
        if !in_digest {
            return;
        }
        if is_block {
            self.block_buff.insert(name, Value::Array(arr));
        } else {
            self.nonblock_buff.insert(name, Value::Array(arr));
        }
    }
    fn insert(&mut self, ty: &BasicDataType, name: String, mut value: Value) {
        let (is_block, in_digest) = match self.pre_insert(ty) {
            Some(t) => t,
            None => return,
        };
        self.incr_and_truncate(is_block, &mut value);
        if !in_digest {
            return;
        }
        if is_block {
            self.block_buff.insert(name, value);
        } else {
            self.nonblock_buff.insert(name, value);
        }
    }
}

pub fn create_article_digest(mut content: Value, category: Category) -> Fallible<ArticleDigest> {
    use force::DataType::*;
    let mut buff = Buff::new();
    let backup = content.clone();
    let json = content.as_object_mut().unwrap();

    for field in category.fields.into_iter() {
        // XXX: 如果使用者搞出一個有撞名欄位的分類，這裡的 unwrap 就會爆掉
        let value = json.remove(&field.name).unwrap();
        match field.datatype {
            Optional(ty) | Single(ty) => {
                buff.insert(&ty, field.name, value);
            }
            Array { t, .. } => match value {
                Value::Array(values) => {
                    buff.insert_arr(&t, field.name, values);
                }
                _ => {}
            },
        }
        if buff.is_done() {
            break;
        }
    }

    Ok(if buff.truncated {
        ArticleDigest {
            content: if buff.has_block() {
                serde_json::to_string(&buff.block_buff)?
            } else {
                serde_json::to_string(&buff.nonblock_buff)?
            },
            truncated: true,
        }
    } else {
        ArticleDigest {
            content: serde_json::to_string(&backup)?,
            truncated: false,
        }
    })
}
