use diesel::prelude::*;
use base64;
use crate::db::{schema as db_schema};
use crate::custom_error::{Fallible};

pub fn update_profile(conn: &PgConnection, user_id: i64, avatar: String) -> Fallible<bool> {
    use db_schema::users;

    println!("{}", avatar);
    diesel::update(users::table.find(user_id))
        .set(users::avatar.eq(base64::decode(&avatar)?))
        .execute(conn)?;
    Ok(true)
}
