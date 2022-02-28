use serde::{Deserialize, Serialize};
use serde_json;
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};
use typescript_definitions::TypeScriptify;

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub enum FieldKind {
    Number,
    OneLine,
    MultiLine,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Field {
    pub name: String,
    pub kind: FieldKind,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Category {
    pub name: String,
    pub fields: Vec<Field>,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Force {
    pub categories: Vec<Category>,
    pub suggested_tags: Vec<String>,
}

#[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
pub struct Bond {
    pub to: i64,
    pub tag: String,
}

#[derive(Debug)]
pub struct ValidationError {
    pub field_name: String,
    pub code: ValidationErrorCode,
}
#[derive(Debug)]
pub enum ValidationErrorCode {
    NotI64(serde_json::Number),
    NotOneline(String),
    TypeMismatch(FieldKind, serde_json::Value),
}
impl Display for ValidationError {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        write!(f, "{:?}", self)
    }
}
impl std::error::Error for ValidationError {}
