use std::io;

use juniper::{FieldError, Value, DefaultScalarValue, IntoFieldError};

#[derive(Debug, Clone)]
pub enum ErrorKey {
    Internal,
    Auth,
}

fn build_field_err(msg: String, key: i32) -> FieldError {
    // let key = format!("{:?}", key);
    // FieldError::new(msg, Value::Scalar(DefaultScalarValue::String(key)))
    FieldError::new(msg, Value::Scalar(DefaultScalarValue::Int(key)))
}

#[derive(Debug, Fail, Clone)]
pub enum Error {
    #[fail(display = "邏輯錯誤：{}，錯誤類型：{:?}", msg, key)]
    LogicError { msg: String, key: i32 },
    #[fail(display = "邏輯錯誤：{}", msg)]
    InternalError { msg: String },
}

impl Error {
    pub fn new_logic<S: AsRef<str>>(msg: S, key: i32) -> Error {
        Error::LogicError {
            msg: msg.as_ref().to_owned(),
            key,
        }
    }
    pub fn new_internal<S: AsRef<str>>(msg: S) -> Error {
        Error::InternalError {
            msg: msg.as_ref().to_owned(),
        }
    }
}

impl IntoFieldError for Error {
    fn into_field_error(self) -> FieldError {
        match self {
            Error::LogicError { msg, key } => build_field_err(msg, key),
            Error::InternalError { msg } => build_field_err(msg, 500),
        }
    }
}
impl From<io::Error> for Error {
    fn from(og: io::Error) -> Error {
        Self::new_internal(format!("{:?}", og))
    }
}

pub type Fallible<T> = Result<T, Error>;
