use std::error::Error as StdError;

use juniper::{FieldError, Value, DefaultScalarValue, IntoFieldError};

#[derive(Clone, Display)]
pub enum ErrorKey {
    #[display(fmt = "INTERNAL")]
    Internal,
    #[display(fmt = "AUTH")]
    Auth,
}

fn build_field_err(msg: String, key: i32) -> FieldError {
    // let key = format!("{:?}", key);
    // FieldError::new(msg, Value::Scalar(DefaultScalarValue::String(key)))
    FieldError::new(msg, Value::Scalar(DefaultScalarValue::Int(key)))
}

#[derive(Debug, Display, Fail)]
pub enum Error {
    #[display(fmt = "邏輯錯誤：{}，錯誤種類：{}", msg, key)]
    LogicError { msg: String, key: i32 },
    #[display(fmt = "內部錯誤：{:?}，原始錯誤為：{:?}", msg, source)]
    InternalError {
        msg: Option<String>,
        source: Option<Box<dyn StdError + Sync + Send + 'static>>,
    },
}

impl Error {
    pub fn new_logic<S: AsRef<str>>(msg: S, key: i32) -> Error {
        Error::LogicError {
            msg: msg.as_ref().to_owned(),
            key,
        }
    }
    /// 若需要在 source 錯誤上打上更清楚的訊息可使用本函式
    pub fn new_internal<S, E>(msg: S, source: E) -> Error
    where
        S: AsRef<str>,
        E: StdError + Sync + Send + 'static,
    {
        Error::InternalError {
            msg: Some(msg.as_ref().to_owned()),
            source: Some(Box::new(source)),
        }
    }
    /// source 錯誤無法被正確封裝才應使用本函式
    pub fn new_internal_without_source<S: AsRef<str>>(msg: S) -> Error {
        Error::InternalError {
            msg: Some(msg.as_ref().to_owned()),
            source: None,
        }
    }
}

impl IntoFieldError for Error {
    fn into_field_error(self) -> FieldError {
        match self {
            Error::LogicError { msg, key } => build_field_err(msg, key),
            _ => build_field_err("內部錯誤".to_owned(), 500),
        }
    }
}

impl<E: StdError + Sync + Send + 'static> From<E> for Error {
    fn from(err: E) -> Error {
        Error::InternalError {
            msg: None,
            source: Some(Box::new(err)),
        }
    }
}

pub type Fallible<T> = Result<T, Error>;
