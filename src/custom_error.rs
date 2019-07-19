/// 可控制的錯誤，如權限問題
#[derive(Debug, Fail, Clone)]
#[fail(display = "邏輯錯誤：{}，錯誤碼：{}", msg, code)]
pub struct LogicalError {
    msg: String,
    code: i32,
}

impl LogicalError {
    pub fn new<S: AsRef<str>>(msg: S, code: i32) -> LogicalError {
        LogicalError {
            msg: msg.as_ref().to_owned(),
            code,
        }
    }
}

/// 不可控制的內部錯誤，如資料庫意外崩潰
#[derive(Debug, Fail, Clone)]
#[fail(display = "內部錯誤: {}", msg)]
pub struct InternalError {
    msg: String,
}

impl InternalError {
    pub fn new<S: AsRef<str>>(msg: S) -> InternalError {
        InternalError {
            msg: msg.as_ref().to_owned(),
        }
    }
}
