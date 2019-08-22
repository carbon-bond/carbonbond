use diesel::pg::PgConnection;
use diesel::prelude::*;
use crate::db::models::User;
use crate::db::schema;
use crate::custom_error::{Error, Fallible};

pub fn find_user_by_id(conn: &PgConnection, id: i64) -> Fallible<User> {
    use schema::users;
    // TODO: 對 SQL 查詢的錯誤做分類
    users::table
        .find(id)
        .first::<User>(conn)
        .map_err(|_| Error::new_logic(format!("找不到 ID 為 {} 使用者", id), 401))
}

pub fn find_user_by_name(conn: &PgConnection, name: &str) -> Fallible<User> {
    use schema::users;
    // TODO: 對 SQL 查詢的錯誤做分類
    users::table
        .filter(users::name.eq(name))
        .first::<User>(conn)
        .map_err(|_| Error::new_logic(format!("找不到使用者: {}", name), 401))
}
