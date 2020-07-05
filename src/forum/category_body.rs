use serde::{Serialize, Deserialize, Deserializer, Serializer};
use serde::de::{Visitor, Error};
use regex::Regex;

use crate::custom_error::{Error as CE, Fallible, ErrorCode};
use crate::MAX_ARTICLE_FIELD;

#[derive(Deserialize, Serialize, Debug)]
pub struct Threshold {
    bond_energy: i32,
    position: i16, // 0平民, 1黨員, 2黨代表, 3黨主席
}

#[derive(Debug)]
pub enum AtomType {
    Line,
    Text,
    Int,
    Rating(u16),
}
fn str_to_atom_type<E: Error>(s: &str) -> Result<AtomType, E> {
    if s == "Line" {
        Ok(AtomType::Line)
    } else if s == "Text" {
        Ok(AtomType::Text)
    } else if s == "Int" {
        Ok(AtomType::Int)
    } else {
        let re_rating = Regex::new(r"^Rating<(\d+)>$").unwrap();
        match re_rating.captures_iter(s).last() {
            Some(cap) => {
                if let Ok(max_res) = cap[1].parse::<u16>() {
                    // TODO: rating 是否有上限?
                    return Ok(AtomType::Rating(max_res));
                } else {
                    return Err(E::custom(format!("解析 Rating 失敗: {}", s)));
                }
            }
            None => Err(E::custom(format!("解析原子類型失敗: {}", s))),
        }
    }
}
fn atom_type_to_str(t: &AtomType) -> String {
    match t {
        AtomType::Line => "Line".to_owned(),
        AtomType::Text => "Text".to_owned(),
        AtomType::Int => "Int".to_owned(),
        AtomType::Rating(max) => format!("Rating<{}>", max),
    }
}

#[derive(Debug)]
pub enum FieldType {
    Arr(AtomType, usize),
    Atom(AtomType),
}

use std::fmt;
struct FieldTypeVisitor;
impl<'de> Visitor<'de> for FieldTypeVisitor {
    type Value = FieldType;
    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("欄位結構")
    }
    fn visit_str<E: Error>(self, value: &str) -> Result<Self::Value, E> {
        let re_arr = Regex::new(r"^\[([A-Za-z<>\d]+); *(\d+)\]$").unwrap();
        match re_arr.captures_iter(value).last() {
            Some(cap_vec) => {
                let atom = str_to_atom_type(&cap_vec[1])?;
                if let Ok(size_res) = cap_vec[2].parse::<usize>() {
                    Ok(FieldType::Arr(atom, size_res))
                } else {
                    Err(E::custom(format!("解析陣列長度失敗: {}", value)))
                }
            }
            None => {
                let atom = str_to_atom_type(value)?;
                Ok(FieldType::Atom(atom))
            }
        }
    }
}
impl<'de> Deserialize<'de> for FieldType {
    fn deserialize<D>(deserializer: D) -> Result<FieldType, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(FieldTypeVisitor)
    }
}
impl Serialize for FieldType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = {
            match self {
                FieldType::Arr(a_type, size) => format!("[{};{}]", atom_type_to_str(a_type), size),
                FieldType::Atom(a_type) => atom_type_to_str(a_type),
            }
        };
        serializer.serialize_str(&s)
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct FieldSchema {
    pub name: String,
    pub r#type: FieldType,
    pub restriction: String,
}

pub enum StringOrI32 {
    Str(String),
    I32(i32),
}

impl FieldSchema {
    pub fn parse_content(&self, content: String) -> Fallible<StringOrI32> {
        match self.r#type {
            FieldType::Atom(AtomType::Line) => {
                if content.contains('\n') {
                    Err(CE::new_other("LINE 型別中含有換行"))
                } else {
                    Ok(StringOrI32::Str(content))
                }
            }
            FieldType::Atom(AtomType::Text) => {
                Ok(StringOrI32::Str(content))
                // TODO: 檢查正則表達式
            }
            FieldType::Atom(AtomType::Int) => {
                if let Ok(t) = content.parse::<i32>() {
                    Ok(StringOrI32::I32(t))
                } else {
                    Err(CE::new_other("Int 型別解析失敗"))
                }
            }
            FieldType::Atom(AtomType::Rating(max)) => {
                if let Ok(r) = content.parse::<u16>() {
                    // 1 ~ max 之中的某個正整數
                    if r <= max && r >= 1 {
                        Ok(StringOrI32::I32(r as i32))
                    } else {
                        Err(CE::new_other(format!(
                            "Rating 型別超出範圍：{}不屬於1~{}",
                            r, max
                        )))
                    }
                } else {
                    Err(CE::new_other("Rating 型別解析失敗"))
                }
            }
            FieldType::Arr(_, _) => unimplemented!("陣列型別尚未實作"),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct CategoryBody {
    pub name: String,
    pub transfusable: bool,
    pub is_question: bool,
    pub show_in_list: bool,
    pub rootable: bool,
    pub threshold_to_post: Threshold,
    pub attached_to: Vec<String>,
    pub structure: Vec<FieldSchema>,
}
impl CategoryBody {
    pub fn to_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
    pub fn from_string(s: &str) -> Fallible<CategoryBody> {
        let t = serde_json::from_str::<Self>(s)
            .map_err(|e| CE::new_logic(ErrorCode::ParsingJson, e.to_string()))?;
        if t.structure.len() > MAX_ARTICLE_FIELD {
            Err(CE::new_other("分類結構長度超過上限"))
        } else {
            Ok(t)
        }
    }
    pub fn can_attach_to(&self, category_name: &str) -> bool {
        for name in self.attached_to.iter() {
            if name == category_name {
                return true;
            }
        }
        false
    }
}
