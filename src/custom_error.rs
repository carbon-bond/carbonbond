use juniper::{FieldError, FieldResult, Value, DefaultScalarValue};

#[derive(Debug, Fail)]
pub enum Error {
    #[fail(display = "內部錯誤")]
    InternalError, // 不可控制的內部錯誤，如資料庫意外崩潰
    #[fail(display = "邏輯錯誤：{}", 0)]
    LogicError(&'static str, i32), // 可控制的錯誤，如權限問題
}

impl Error {
    pub fn to_field_result<T>(&self) -> FieldResult<T> {
        let err = match self {
            Error::LogicError(msg, code) => build_field_err(msg, *code),
            _ => build_field_err("內部錯誤", 500),
        };
        Err(err)
    }
}

pub fn build_field_err(msg: &str, code: i32) -> FieldError {
    FieldError::new(msg, Value::Scalar(DefaultScalarValue::Int(code)))
}
