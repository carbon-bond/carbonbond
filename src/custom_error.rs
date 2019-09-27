use std::error::Error as StdError;

use juniper::{FieldError, Value, IntoFieldError};

#[derive(Clone, Display, Debug)]
pub enum DataType {
    #[display(fmt = "CATEGORY")]
    Category,
    #[display(fmt = "CONTENT")]
    Content,
    #[display(fmt = "BOARD")]
    Board,
    #[display(fmt = "ARTICLE")]
    Article,
    #[display(fmt = "PARTY")]
    Party,
    #[display(fmt = "USER")]
    User,
    #[display(fmt = "INVITE_CODE")]
    InviteCode,
}

#[derive(Clone, Display, Debug)]
pub enum ErrorKey {
    #[display(fmt = "INTERNAL")]
    Internal,
    #[display(fmt = "NEED_LOGIN")]
    NeedLogin,
    #[display(fmt = "PERMISSION_DENIED")]
    PermissionDenied,
    #[display(fmt = "NOT_FOUND({}, {})", "_0", "_1")]
    NotFound(DataType, String),
    #[display(fmt = "PARSE_ID")]
    ParseID,
    #[display(fmt = "BAD_OPERATION({})", "_0")]
    BadOperation(String),
    #[display(fmt = "PARSING_JSON")]
    ParsingJson,
}

fn build_field_err(key: ErrorKey) -> FieldError {
    FieldError::new(key, Value::null())
}

#[derive(Debug)]
pub enum Error {
    /// 此錯誤代表程式使用者對於碳鍵程式的異常操作
    OperationError { msg: String },
    /// 此錯誤代表應拋給前端使用者的訊息
    LogicError { key: ErrorKey },
    /// 此錯誤代表其它無法預期的錯誤
    InternalError {
        msg: Option<String>,
        source: Option<Box<dyn StdError + Sync + Send + 'static>>,
    },
}

impl Error {
    pub fn new_op<S: AsRef<str>>(msg: S) -> Error {
        Error::OperationError {
            msg: msg.as_ref().to_owned(),
        }
    }
    pub fn new_bad_op<S: AsRef<str>>(msg: S) -> Error {
        Error::LogicError {
            key: ErrorKey::BadOperation(msg.as_ref().to_owned()),
        }
    }
    pub fn new_logic(key: ErrorKey) -> Error {
        Error::LogicError { key }
    }
    pub fn new_not_found<S: std::fmt::Debug>(err_type: DataType, target: S) -> Error {
        Error::new_logic(ErrorKey::NotFound(err_type, format!("{:?}", target)))
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

    pub fn add_msg<S: AsRef<str>>(self, more_msg: S) -> Error {
        let more_msg = more_msg.as_ref().to_owned();
        match self {
            Error::LogicError { key } => Error::new_logic(key),
            Error::OperationError { msg } => Error::new_op(format!("{}\n{}", more_msg, msg)),
            Error::InternalError { msg, source } => {
                let new_msg = if let Some(msg) = msg {
                    format!("{}\n{}", more_msg, msg)
                } else {
                    more_msg
                };
                Error::InternalError {
                    msg: Some(new_msg),
                    source,
                }
            }
        }
    }
}

use std::fmt;
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::LogicError { key } => write!(f, "邏輯錯誤，錯誤種類：{}", key),
            Error::OperationError { msg } => write!(f, "操作錯誤：{}", msg),
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
            Error::LogicError { key } => build_field_err(key),
            _ => build_field_err(ErrorKey::Internal),
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
