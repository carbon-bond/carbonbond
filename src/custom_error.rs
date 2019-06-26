#[derive(Debug)]
pub enum Error {
    InternalError,      // 不可控制的內部錯誤，如資料庫意外崩潰
    LogicError(String), // 可控制的錯誤，如權限問題
}
