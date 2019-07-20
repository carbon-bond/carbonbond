use diesel::pg::PgConnection;
use diesel::prelude::*;
use failure::Fallible;
use crate::db::models::User;
use crate::db::schema;
use crate::custom_error::LogicalError;

pub fn find_user(conn: &PgConnection, id: &str) -> Fallible<User> {
    // TODO: 對 SQL 查詢的錯誤做分類
    schema::users::table
        .find(id)
        .first::<User>(conn)
        .map_err(|_| LogicalError::new(format!("找不到使用者: {}", id), 401).into())
}
