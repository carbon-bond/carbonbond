use crate::defs::BasicDataType;
use regex::Regex;
use serde_json::{value::Number, Error as JsonError, Value};
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};

#[derive(Debug)]
pub struct ValidationError<OtherError> {
    pub field_name: String,
    pub code: ValidationErrorCode<OtherError>,
}
#[derive(Debug)]
pub enum ValidationErrorCode<OtherError> {
    Other(OtherError),
    NotI64(Number),
    NotOneline(String),
    RegexFail(Regex, String),
    Json(JsonError),
    TypeMismatch(BasicDataType, Value),
    NotArray(Value),
    ArrayLengthMismatch {
        min: usize,
        max: usize,
        actual: usize,
    },
}

impl<E: Display + Debug> Display for ValidationError<E> {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        write!(f, "{:?}", self)
    }
}
impl<E: Display + Debug> std::error::Error for ValidationError<E> {}
