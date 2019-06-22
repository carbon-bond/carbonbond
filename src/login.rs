use diesel::pg::PgConnection;
use diesel::prelude::*;
use crate::db::models::User;
use crate::db::schema;

#[derive(Debug)]
pub enum Error {
    InternalError,      // 不可控制的內部錯誤，如資料庫意外崩潰
    LogicError(String), // 可控制的錯誤，如權限問題
}

pub fn login(conn: &PgConnection, id: &str, password: &str) -> Result<(), Error> {
    // TODO: 對 SQL 查詢的錯誤做分類
    let user = schema::users::table
        .find(id)
        .first::<User>(conn)
        .map_err(|_| Error::LogicError("找不到 ID".to_string()))?;

    // TODO: 把 password_bytes 改名爲 hash
    let equal = argon2::verify_raw(
        password.as_bytes(),
        &user.salt,
        &user.password_bytes,
        &argon2::Config::default(),
    )
    .unwrap();

    match equal {
        true => Ok(()),
        false => Err(Error::LogicError("密碼錯誤".to_string())),
    }
}
