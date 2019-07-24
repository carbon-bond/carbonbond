use std::error::Error as StdError;

use juniper::{FieldError, Value, DefaultScalarValue, IntoFieldError};

#[derive(Clone, Display)]
pub enum ErrorKey {
    #[display(fmt = "INTERNAL")]
    Internal,
    #[display(fmt = "AUTH")]
    Auth,
}

fn build_field_err(msg: &str, key: i32) -> FieldError {
    // let key = format!("{:?}", key);
    // FieldError::new(msg, Value::Scalar(DefaultScalarValue::String(key)))
    FieldError::new(msg, Value::Scalar(DefaultScalarValue::Int(key)))
}

#[derive(Debug)]
pub enum Error {
    LogicError {
        msg: String,
        key: i32,
    },
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
    /// 若需要對原始錯誤打上更清楚的訊息可使用本函式
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
    /// 原始錯誤無法被正確封裝才應使用本函式
    pub fn new_internal_without_source<S: AsRef<str>>(msg: S) -> Error {
        Error::InternalError {
            msg: Some(msg.as_ref().to_owned()),
            source: None,
        }
    }
}

use std::fmt;
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::LogicError { msg, key } => write!(f, "邏輯錯誤：{}，錯誤種類：{}", msg, key),
            Error::InternalError { msg, source } => {
                write!(f, "內部錯誤")?;
                if let Some(msg) = msg {
                    write!(f, "：{}", msg)?;
                }
                if let Some(source) = source {
                    write!(f, "，原始錯誤為：{:?}", source)?;
                }
                Ok(())
            }
        }
    }
}

impl IntoFieldError for Error {
    fn into_field_error(self) -> FieldError {
        match self {
            Error::LogicError { msg, key } => build_field_err(&msg, key),
            _ => build_field_err("內部錯誤", 500),
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
