use crate::lexer;
use regex::Regex;
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum Bondee {
    All,
    Choices {
        category: Vec<String>,
        family: Vec<String>,
    },
}
// TODO: 處理輸能等等額外設定
#[derive(Debug, Clone, PartialEq)]
pub struct Tag {
    pub name: String,
}

#[derive(Debug, Clone)]
pub enum BasicDataType {
    Bond(Bondee),
    TaggedBond(Bondee, Vec<Tag>),
    OneLine,
    Text(Option<Regex>), // 正則表達式
    Number,
}

impl PartialEq for BasicDataType {
    fn eq(&self, other: &BasicDataType) -> bool {
        match (self, other) {
            (BasicDataType::Bond(bondee), BasicDataType::Bond(other_bondee)) => {
                bondee == other_bondee
            }
            (
                BasicDataType::TaggedBond(bondee, tags),
                BasicDataType::TaggedBond(other_bondee, other_tags),
            ) => bondee == other_bondee && tags == other_tags,
            (BasicDataType::OneLine, BasicDataType::OneLine) => true,
            (BasicDataType::Text(Some(regex)), BasicDataType::Text(Some(other_regex))) => {
                regex.as_str() == other_regex.as_str()
            }
            (BasicDataType::Number, BasicDataType::Number) => true,
            _ => false,
        }
    }
}

#[derive(Debug, PartialEq)]
pub enum DataType {
    Optional(BasicDataType),
    Single(BasicDataType),
    Array {
        t: BasicDataType,
        min: usize,
        max: usize,
    },
}

impl DataType {
    pub fn basic_type(&self) -> &BasicDataType {
        match self {
            DataType::Optional(t) => t,
            DataType::Single(t) => t,
            DataType::Array {
                t,
                min: _min,
                max: _max,
            } => t,
        }
    }
}

impl From<BasicDataType> for DataType {
    fn from(t: BasicDataType) -> Self {
        DataType::Single(t)
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
    pub family: Vec<String>,
    pub fields: Vec<Field>,
}

pub type Categories = HashMap<String, Category>;

#[derive(Debug)]
pub struct Force {
    pub families: HashMap<String, Vec<String>>,
    pub categories: Categories,
}

#[derive(Debug)]
pub enum ForceError {
    InvalidBond {
        not_found_categories: Vec<String>,
        not_found_families: Vec<String>,
    },
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
