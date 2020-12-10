use crate::defs::BasicDataType;
use regex::Regex;
use serde_json::{value::Number, Error as JsonError, Value};
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};
#[derive(Debug)]
pub enum Error<OtherError> {
    Validation(ValidationError),
    Other(OtherError),
}
impl<E> Error<E> {
    pub fn validation_err(self) -> Option<(String, ValidationErrorCode)> {
        match self {
            Error::Validation(ValidationError { field_name, code }) => Some((field_name, code)),
            _ => None,
        }
    }
}

#[derive(Debug)]
pub struct ValidationError {
    pub field_name: String,
    pub code: ValidationErrorCode,
}
#[derive(Debug)]
pub enum ValidationErrorCode {
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
    BondFail,
}
impl ValidationErrorCode {
    pub(crate) fn to_res<T, E, S: AsRef<str>>(self, field_name: S) -> Result<T, Error<E>> {
        let field_name = field_name.as_ref().to_owned();
        Err(Error::Validation(ValidationError {
            field_name,
            code: self,
        }))
    }
}

impl<E: Display + Debug> Display for Error<E> {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        write!(f, "{:?}", self)
    }
}
impl<E: Display + Debug> std::error::Error for Error<E> {}
