use crate::custom_error::Fallible;
use force::{
    BasicDataType::{self, *},
    Category,
};
use serde_json::{Map, Value};

#[derive(Debug, Default)]
struct Buff {
    max_txt: usize,
    nontxt_count: usize,
    text_count: usize,
    nontxt_buff: Map<String, Value>,
    text_buff: Map<String, Value>,
}
impl Buff {
    fn is_done(&self) -> bool {
        if self.has_txt() {
            self.text_count > self.max_txt
        } else {
            self.nontxt_count > self.max_txt
        }
    }
    fn has_txt(&self) -> bool {
        self.text_count > 0
    }
    fn incr_and_truncate(&mut self, is_text: bool, value: &mut Value) {
        macro_rules! truncate {
            ($s:expr, $count:expr) => {
                let diff = self.max_txt - $count;
                match $s.char_indices().nth(diff) {
                    None => (),
                    Some((idx, _)) => $s.truncate(idx),
                }
                $count += $s.len();
            };
        }
        match value {
            Value::String(s) => {
                if is_text {
                    truncate!(s, self.text_count);
                } else {
                    truncate!(s, self.nontxt_count);
                }
            }
            Value::Number(_) | Value::Bool(_) => {
                self.nontxt_count += 1;
            }
            _ => {
                log::warn!("未知的型別 {}", value);
                self.text_count += self.max_txt;
            }
        }
    }
    fn insert_arr(&mut self, ty: &BasicDataType, name: String, mut arr: Vec<Value>) {
        let is_text = match ty {
            Text(_) => true,
            Bond(_) => return,
            _ => false,
        };
        if !is_text && self.has_txt() {
            return;
        }
        for v in arr.iter_mut() {
            self.incr_and_truncate(is_text, v);
        }
        if is_text {
            self.text_buff.insert(name, Value::Array(arr));
        } else {
            self.nontxt_buff.insert(name, Value::Array(arr));
        }
    }
    fn insert(&mut self, ty: &BasicDataType, name: String, mut value: Value) {
        let is_text = match ty {
            Text(_) => true,
            Bond(_) => return,
            _ => false,
        };
        if !is_text && self.has_txt() {
            return;
        }
        self.incr_and_truncate(is_text, &mut value);
        if is_text {
            self.text_buff.insert(name, value);
        } else if !self.has_txt() {
            self.nontxt_buff.insert(name, value);
        }
    }
}

pub fn create_article_digest(mut content: Value, category: Category) -> Fallible<String> {
    use force::DataType::*;
    let mut buff = Buff {
        max_txt: 500,
        ..Buff::default()
    };
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

    Ok(if buff.has_txt() {
        serde_json::to_string(&buff.text_buff)?
    } else {
        serde_json::to_string(&buff.nontxt_buff)?
    })
}
