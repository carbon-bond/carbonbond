use crate::lexer;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::sync::Arc;
use typescript_definitions::TypeScriptify;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TypeScriptify)]
pub enum Bondee {
    // XXX: 輸能？
    All,
    Choices {
        category: Vec<String>,
        family: Vec<String>,
    },
}

fn serialize_regex<S>(re: &Option<Regex>, s: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    if let Some(re) = re {
        s.serialize_str(&re.to_string())
    } else {
        s.serialize_none()
    }
}

fn deserialize_regex<'de, D>(d: D) -> Result<Option<Regex>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s: Option<&str> = serde::Deserialize::deserialize(d)?;
    if let Some(s) = s {
        let re = Regex::new(s).map_err(|e| serde::de::Error::custom(e.to_string()))?;
        Ok(Some(re))
    } else {
        Ok(None)
    }
}

#[derive(Debug, Serialize, Deserialize, TypeScriptify, Clone)]
pub enum BasicDataType {
    Bond(Bondee),
    OneLine,
    #[serde(
        serialize_with = "serialize_regex",
        deserialize_with = "deserialize_regex"
    )]
    Text(Option<Regex>), // 正則表達式
    Number,
}

impl PartialEq for BasicDataType {
    fn eq(&self, other: &BasicDataType) -> bool {
        match (self, other) {
            (BasicDataType::Bond(bondee), BasicDataType::Bond(other_bondee)) => {
                bondee == other_bondee
            }
            (BasicDataType::OneLine, BasicDataType::OneLine) => true,
            (BasicDataType::Text(Some(regex)), BasicDataType::Text(Some(other_regex))) => {
                regex.as_str() == other_regex.as_str()
            }
            (BasicDataType::Number, BasicDataType::Number) => true,
            _ => false,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, TypeScriptify)]
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

#[derive(Debug, PartialEq, Serialize, Deserialize, TypeScriptify)]
pub struct Field {
    pub datatype: DataType,
    pub name: String,
}

#[derive(Debug, PartialEq, Serialize, Deserialize, TypeScriptify)]
pub struct Category {
    pub source: String,
    pub name: String,
    pub family: Vec<String>,
    pub fields: Vec<Field>,
}

pub type Categories = HashMap<String, Arc<Category>>;

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
