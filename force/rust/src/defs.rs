use crate::lexer;
use regex::Regex;
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum Bondee {
    All,
    Choices(Vec<String>),
}
// TODO: 處理輸能等等額外設定
#[derive(Debug, Clone, PartialEq)]
pub struct Tag {
    pub name: String,
}

#[derive(Debug, Clone)]
pub enum DataType {
    Bond(Bondee),
    TaggedBond(Bondee, Vec<Tag>),
    OneLine,
    Text(Option<Regex>), // 正則表達式
    Number,
}

impl PartialEq for DataType {
    fn eq(&self, other: &DataType) -> bool {
        match (self, other) {
            (DataType::Bond(bondee), DataType::Bond(other_bondee)) => bondee == other_bondee,
            (
                DataType::TaggedBond(bondee, tags),
                DataType::TaggedBond(other_bondee, other_tags),
            ) => bondee == other_bondee && tags == other_tags,
            (DataType::OneLine, DataType::OneLine) => true,
            (DataType::Text(Some(regex)), DataType::Text(Some(other_regex))) => {
                regex.as_str() == other_regex.as_str()
            }
            (DataType::Number, DataType::Number) => true,
            _ => false,
        }
    }
}

#[derive(Debug, PartialEq)]
pub struct Field {
    pub datatype: DataType,
    pub name: String,
}

#[derive(Debug, PartialEq)]
pub struct Category {
    pub source: String,
    pub name: String,
    pub fields: Vec<Field>,
}

pub type Categories = HashMap<String, Category>;

#[derive(Debug)]
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
    InvalidRegex {
        regex: String,
    },
}

impl fmt::Display for ForceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "力語言錯誤")
    }
}

impl std::error::Error for ForceError {}

pub type ForceResult<T> = Result<T, ForceError>;
