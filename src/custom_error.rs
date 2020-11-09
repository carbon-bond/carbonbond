use chitin::*;
#[chitin_model]
mod inner {
    use chitin::chitin_util;
    use serde::{Deserialize, Serialize};
    use std::error::Error as StdError;
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};

    #[derive(Serialize, Deserialize, Clone, Display, Debug, PartialEq, Eq, TypeScriptify)]
    pub enum DataType {
        #[display(fmt = "分類")]
        Category,
        #[display(fmt = "整數欄位")]
        IntField,
        #[display(fmt = "文字欄位")]
        StringField,
        #[display(fmt = "鍵結欄位")]
        BondField,
        #[display(fmt = "看板")]
        Board,
        #[display(fmt = "文章")]
        Article,
        #[display(fmt = "政黨")]
        Party,
        #[display(fmt = "使用者")]
        User,
        #[display(fmt = "通知")]
        Notification,
        #[display(fmt = "註冊碼")]
        SignupToken,
    }

    #[derive(Serialize, Deserialize, Clone, Display, Debug, PartialEq, Eq, TypeScriptify)]
    pub enum ErrorCode {
        #[display(fmt = "尚未登入")]
        NeedLogin,
        #[display(fmt = "權限不足")]
        PermissionDenied,
        #[display(fmt = "找不到{}： {}", "_0", "_1")]
        NotFound(DataType, String),
        #[display(fmt = "重複註冊")]
        DuplicateRegister,
        #[display(fmt = "JSON 解析錯誤")]
        ParsingJson,
        #[display(fmt = "後端尚未實作")]
        UnImplemented,
        #[display(fmt = "其它： {}", "_0")]
        Other(String),
    }
    impl ErrorCode {
        pub fn context<S: ToString>(self, context: S) -> Error {
            Error::new_logic(self, context)
        }
    }
    #[derive(Serialize, Debug, TypeScriptify)]
    pub enum Error {
        /// 此錯誤代表程式使用者對於碳鍵程式的異常操作
        OperationError { msg: Vec<String> },
        /// 此錯誤代表應拋給前端使用者的訊息
        LogicError { msg: Vec<String>, code: ErrorCode },
        /// 此錯誤代表其它無法預期的錯誤
        InternalError {
            msg: Vec<String>,
            #[serde(skip_serializing)]
            source: Option<Box<dyn StdError + Sync + Send + 'static>>,
        },
    }

    impl Error {
        pub fn new_op<S: ToString>(msg: S) -> Error {
            Error::OperationError {
                msg: vec![msg.to_string()],
            }
        }
        pub fn new_logic<S: ToString>(code: ErrorCode, msg: S) -> Error {
            Error::LogicError {
                msg: vec![msg.to_string()],
                code,
            }
        }
        pub fn code(&self) -> Option<ErrorCode> {
            match self {
                Error::LogicError { code, .. } => Some(code.clone()),
                _ => None,
            }
        }
        /// 原始錯誤無法被正確封裝才應使用本函式
        pub fn new_internal<S: ToString>(msg: S) -> Error {
            Error::InternalError {
                msg: vec![msg.to_string()],
                source: None,
            }
        }
        pub fn context<S: ToString>(mut self, context: S) -> Error {
            let msg = match &mut self {
                Error::LogicError { msg, .. } => msg,
                Error::InternalError { msg, .. } => msg,
                Error::OperationError { msg, .. } => msg,
            };
            msg.push(context.to_string());
            self
        }
    }

    fn fmt_msg(msg: &[String], f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if msg.len() != 0 {
            write!(f, "額外訊息：\n")?;
            for s in msg {
                write!(f, "    {}\n", s)?;
            }
        }
        Ok(())
    }
    use std::fmt;
    impl fmt::Display for Error {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                Error::LogicError { msg, code } => {
                    write!(f, "邏輯錯誤，錯誤種類：{}。", code)?;
                    fmt_msg(msg, f)
                }
                Error::OperationError { msg } => {
                    write!(f, "操作錯誤。")?;
                    fmt_msg(msg, f)
                }
                Error::InternalError { msg, source } => {
                    if let Some(source) = source {
                        write!(f, "內部錯誤，原始錯誤為：{}。", source)?;
                    } else {
                        write!(f, "內部錯誤。")?;
                    }
                    fmt_msg(msg, f)
                }
            }
        }
    }

    impl From<ErrorCode> for Error {
        fn from(code: ErrorCode) -> Error {
            Error::LogicError { msg: vec![], code }
        }
    }

    impl<E: StdError + Sync + Send + 'static> From<E> for Error {
        fn from(err: E) -> Error {
            Error::InternalError {
                msg: vec![],
                source: Some(Box::new(err)),
            }
        }
    }

    pub type Fallible<T = ()> = Result<T, Error>;

    pub trait Contextable<T> {
        fn context<S: ToString>(self, msg: S) -> Fallible<T>;
    }
    impl<T> Contextable<T> for Fallible<T> {
        fn context<S: ToString>(self, context: S) -> Fallible<T> {
            match self {
                Ok(t) => Ok(t),
                Err(err) => Err(err.context(context)),
            }
        }
    }

    impl<T, E: StdError + Send + Sync + 'static> Contextable<T> for Result<T, E> {
        fn context<S: ToString>(self, context: S) -> Fallible<T> {
            match self {
                Err(err) => {
                    let err: Error = err.into();
                    Err(err).context(context)
                }
                Ok(t) => Ok(t),
            }
        }
    }
}
pub use inner::*;
