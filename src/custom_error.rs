use std::error::Error as StdError;

use juniper::{FieldError, Value, IntoFieldError};

#[derive(Clone, Display, Debug)]
pub enum DataType {
    #[display(fmt = "分類")]
    Category,
    #[display(fmt = "內容")]
    Content,
    #[display(fmt = "看板")]
    Board,
    #[display(fmt = "文章")]
    Article,
    #[display(fmt = "政黨")]
    Party,
    #[display(fmt = "使用者")]
    User,
    #[display(fmt = "邀請碼")]
    InviteCode,
}

#[derive(Clone, Display, Debug)]
pub enum ErrorCode {
    #[display(fmt = "內部錯誤")]
    Internal,
    #[display(fmt = "尚未登入")]
    NeedLogin,
    #[display(fmt = "權限不足")]
    PermissionDenied,
    #[display(fmt = "找不到{}： {}", "_0", "_1")]
    NotFound(DataType, String),
    #[display(fmt = "ID 解析錯誤")]
    ParseID,
    #[display(fmt = "JSON 解析錯誤")]
    ParsingJson,
    #[display(fmt = "{}", "_0")]
    Other(String),
}

fn build_field_err(code: ErrorCode) -> FieldError {
    FieldError::new(code, Value::null())
}

#[derive(Debug)]
pub enum Error {
    /// 此錯誤代表程式使用者對於碳鍵程式的異常操作
    OperationError { msg: String },
    /// 此錯誤代表應拋給前端使用者的訊息
    LogicError { code: ErrorCode },
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
    pub fn new_other<S: AsRef<str>>(msg: S) -> Error {
        Error::LogicError {
            code: ErrorCode::Other(msg.as_ref().to_owned()),
        }
    }
    pub fn new_logic(code: ErrorCode) -> Error {
        Error::LogicError { code }
    }
    pub fn new_not_found<S: std::fmt::Debug>(err_type: DataType, target: S) -> Error {
        Error::new_logic(ErrorCode::NotFound(err_type, format!("{:?}", target)))
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
            Error::LogicError { code } => Error::new_logic(code),
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
            Error::LogicError { code } => write!(f, "邏輯錯誤，錯誤種類：{}", code),
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
            Error::LogicError { code } => build_field_err(code),
            _ => build_field_err(ErrorCode::Internal),
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
