use juniper::{FieldError, FieldResult, Value, DefaultScalarValue};

#[derive(Debug, Fail)]
pub enum Error {
    #[fail(display = "內部錯誤: {}", 0)]
    InternalError(String), // 不可控制的內部錯誤，如資料庫意外崩潰
    #[fail(display = "邏輯錯誤：{}", 0)]
    LogicError(String, i32), // 可控制的錯誤，如權限問題
}

impl Error {
    pub fn new_logic(msg: &str, code: i32) -> Error {
        Error::LogicError(msg.to_owned(), code)
    }
    pub fn new_internal(msg: &str) -> Error {
        Error::InternalError(msg.to_owned())
    }

    pub fn to_field_result<T>(&self) -> FieldResult<T> {
        Err(self.to_field_err())
    }
    pub fn to_field_err(&self) -> FieldError {
        match self {
            Error::LogicError(msg, code) => build_field_err(msg, *code),
            Error::InternalError(msg) => build_field_err(msg, 500),
        }
    }
    pub fn get_msg(&self) -> &str {
        match self {
            Error::LogicError(msg, _) => msg,
            Error::InternalError(msg) => msg,
        }
    }
}

fn build_field_err(msg: &str, code: i32) -> FieldError {
    FieldError::new(msg, Value::Scalar(DefaultScalarValue::Int(code)))
}
