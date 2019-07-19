extern crate serde_json;
use serde::{Serialize, Deserialize, Deserializer, Serializer};
use serde::de::{Visitor, Error};
extern crate regex;
use regex::Regex;

use crate::MAX_ARTICLE_COLUMN;

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
pub enum ColType {
    Arr(AtomType, usize),
    Atom(AtomType),
}

use std::fmt;
struct ColTypeVisitor;
impl<'de> Visitor<'de> for ColTypeVisitor {
    type Value = ColType;
    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("欄位結構")
    }
    fn visit_str<E: Error>(self, value: &str) -> Result<Self::Value, E> {
        let re_arr = Regex::new(r"^\[([A-Za-z<>\d]+); *(\d+)\]$").unwrap();
        match re_arr.captures_iter(value).last() {
            Some(cap_vec) => {
                let atom = str_to_atom_type(&cap_vec[1])?;
                if let Ok(size_res) = cap_vec[2].parse::<usize>() {
                    Ok(ColType::Arr(atom, size_res))
                } else {
                    Err(E::custom(format!("解析陣列長度失敗: {}", value)))
                }
            }
            None => {
                let atom = str_to_atom_type(value)?;
                Ok(ColType::Atom(atom))
            }
        }
    }
}
impl<'de> Deserialize<'de> for ColType {
    fn deserialize<D>(deserializer: D) -> Result<ColType, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(ColTypeVisitor)
    }
}
impl Serialize for ColType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = {
            match self {
                ColType::Arr(a_type, size) => format!("[{};{}]", atom_type_to_str(a_type), size),
                ColType::Atom(a_type) => atom_type_to_str(a_type),
            }
        };
        serializer.serialize_str(&s)
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ColSchema {
    pub col_name: String,
    pub col_type: ColType,
    pub restriction: String,
}

pub enum StringOrI32 {
    Str(String),
    I32(i32),
}

use crate::custom_error::Error as CE;
impl ColSchema {
    pub fn parse_content(&self, content: String) -> Result<StringOrI32, CE> {
        match self.col_type {
            ColType::Atom(AtomType::Line) => {
                if content.contains('\n') {
                    Err(CE::new_logic("一行內容帶有換行符", 403))
                } else {
                    Ok(StringOrI32::Str(content))
                }
            }
            ColType::Atom(AtomType::Text) => {
                Ok(StringOrI32::Str(content))
                // TODO: 檢查正則表達式
            }
            ColType::Atom(AtomType::Int) => {
                if let Ok(t) = content.parse::<i32>() {
                    Ok(StringOrI32::I32(t))
                } else {
                    Err(CE::new_logic(
                        &format!("整數型解析失敗: {}", content),
                        403,
                    ))
                }
            }
            ColType::Atom(AtomType::Rating(max)) => {
                if let Ok(r) = content.parse::<u16>() {
                    // 1 ~ max 之中的某個正整數
                    if r <= max && r >= 1 {
                        Ok(StringOrI32::I32(r as i32))
                    } else {
                        Err(CE::new_logic(
                            &format!("評分型範圍錯誤: {} 不屬於 1~{}", r, max),
                            403,
                        ))
                    }
                } else {
                    Err(CE::new_logic(
                        &format!("評分型解析失敗: {}", content),
                        403,
                    ))
                }
            }
            ColType::Arr(_, _) => unimplemented!("陣列型別尚未實作"),
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
    pub structure: Vec<ColSchema>,
}
impl CategoryBody {
    pub fn to_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
    pub fn from_string(s: &str) -> Result<CategoryBody, CE> {
        let t =
            serde_json::from_str::<Self>(s).or(Err(CE::new_logic("解析分類失敗", 403)))?;
        if t.structure.len() > MAX_ARTICLE_COLUMN {
            Err(CE::new_logic(
                &format!("文章結構過長: {}", t.name),
                403,
            ))
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
