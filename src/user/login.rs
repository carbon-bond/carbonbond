use diesel::pg::PgConnection;
use diesel::prelude::*;
use failure::Fallible;
use crate::db::models::User;
use crate::db::schema;
use crate::custom_error::LogicalError;

pub fn login(conn: &PgConnection, id: &str, password: &str) -> Fallible<()> {
    // TODO: 對 SQL 查詢的錯誤做分類
    let user = schema::users::table
        .find(id)
        .first::<User>(conn)
        .or(Err(LogicalError::new(
            &format!("找不到使用者: {}", id),
            401,
        )))?;

    let equal = argon2::verify_raw(
        password.as_bytes(),
        &user.salt,
        &user.password_hashed,
        &argon2::Config::default(),
    )
    .unwrap();

    match equal {
        true => Ok(()),
        false => Err(LogicalError::new("密碼錯誤", 401).into()),
    }
}
