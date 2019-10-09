use rand::Rng;
use diesel::prelude::*;
use crate::db::{models as db_models, schema as db_schema};
use crate::custom_error::{Fallible, Error};
use crate::user::{email, find_user_by_id, find_user_by_name};

pub fn change_password(
    conn: &PgConnection,
    user_id: i64,
    old_password: String,
    new_password: String,
) -> Fallible<bool> {
    use db_schema::users;
    let user = find_user_by_id(conn, user_id)?;
    let equal = argon2::verify_raw(
        old_password.as_bytes(),
        &user.salt,
        &user.password_hashed,
        &argon2::Config::default(),
    )?;
    match equal {
        true => {
            let salt = rand::thread_rng().gen::<[u8; 16]>();
            let hash = argon2::hash_raw(new_password.as_bytes(), &salt, &argon2::Config::default())
                .unwrap();
            diesel::update(users::table.find(user_id))
                .set((
                    users::password_hashed.eq(hash),
                    users::salt.eq(salt.to_vec()),
                ))
                .execute(conn)?;
            Ok(true)
        }
        false => Err(Error::new_other("密碼錯誤")),
    }
}

pub fn forget_password(conn: &PgConnection, name: String) -> Fallible<bool> {
    let user = find_user_by_name(conn, &name)?;
    use rand::distributions::Alphanumeric;
    let code: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect();
    let reset_password = db_models::NewResetPassword {
        code: &code,
        user_id: user.id,
    };
    diesel::insert_into(db_schema::reset_password::table)
        .values(&reset_password)
        .execute(conn)?;
    email::send_reset_password_email(&code, &user.email)?;
    Ok(true)
}

pub fn reset_password(conn: &PgConnection, code: String, new_password: String) -> Fallible<bool> {
    use db_schema::{users, reset_password};
    let reset_password = reset_password::table
        .filter(reset_password::code.eq(code.to_owned()))
        .first::<db_models::ResetPassword>(conn)
        .or(Err(Error::new_other("查無重設密碼代碼")))?;
    match reset_password.is_used {
        true => Err(Error::new_other("代碼已用過")),
        false => {
            let salt = rand::thread_rng().gen::<[u8; 16]>();
            let hash = argon2::hash_raw(new_password.as_bytes(), &salt, &argon2::Config::default())
                .unwrap();
            diesel::update(users::table.find(reset_password.user_id))
                .set((
                    users::password_hashed.eq(hash),
                    users::salt.eq(salt.to_vec()),
                ))
                .execute(conn)?;
            diesel::update(reset_password::table.filter(reset_password::code.eq(code.to_owned())))
                .set(reset_password::is_used.eq(true))
                .execute(conn)?;
            Ok(true)
        }
    }
}
