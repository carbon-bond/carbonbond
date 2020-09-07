use serde::{Deserialize, Serialize};
use std::collections::HashMap;
pub mod lexer;
pub mod parser;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Bondee {
    All,
    Choices(Vec<String>),
}
// TODO: 處理輸能等等額外設定
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Tag {
    name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum DataType {
    Bond(Bondee),
    TaggedBond(Bondee, Vec<Tag>),
    OneLine,
    Text(Option<String>), // 正則表達式
    Number,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Field {
    pub datatype: DataType,
    pub name: String,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Category {
    pub source: String,
    pub name: String,
    pub fields: Vec<Field>,
}

type Categories = HashMap<String, Category>;

#[derive(Debug, Serialize, Deserialize)]
pub struct Force {
    pub categories: Categories,
}

#[derive(Debug)]
pub enum ForceError {
    NonExpect {
        expect: lexer::Token,
        fact: lexer::Token,
    },
    NoMeet {
        expect: String,
        fact: lexer::Token,
    },
}

impl fmt::Display for ForceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "力語言錯誤")
    }
}

impl std::error::Error for ForceError {}

pub type ForceResult<T> = Result<T, ForceError>;

pub use crate::parser::{parse, parse_category};
