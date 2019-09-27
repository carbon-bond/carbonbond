use diesel::pg::PgConnection;
use diesel::prelude::*;
use crate::db::models::User;
use crate::db::schema;
use crate::custom_error::{Error, Fallible, DataType};

pub fn login(conn: &PgConnection, name: &str, password: &str) -> Fallible<User> {
    use schema::users;
    // TODO: 對 SQL 查詢的錯誤做分類
    let user = users::table
        .filter(users::name.eq(name))
        .first::<User>(conn)
        .map_err(|_| Error::new_not_found(DataType::User, name))?;

    let equal = argon2::verify_raw(
        password.as_bytes(),
        &user.salt,
        &user.password_hashed,
        &argon2::Config::default(),
    )?;

    match equal {
        true => Ok(user),
        false => Err(Error::new_bad_op("密碼錯誤")),
    }
}
