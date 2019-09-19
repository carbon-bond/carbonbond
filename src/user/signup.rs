use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::result::Error as DBError;
use rand::Rng;
use crate::db::{
    schema,
    models::{NewUser, User, NewInvitation, Invitation},
};
use crate::custom_error::{Error, Fallible};
use crate::config::CONFIG;

// 回傳邀請碼
pub fn create_invitation(
    conn: &PgConnection,
    sender: Option<i64>,
    email: &str,
    words: &str,
) -> Fallible<String> {
    use rand::distributions::Alphanumeric;

    let invite_code: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect();

    match sender {
        Some(id) => {
            let user = schema::users::table
                .find(id)
                .first::<User>(conn)
                .map_err(|e| match e {
                    DBError::NotFound => Error::new_logic(format!("查無使用者: {}", id), 404),
                    _ => e.into(),
                })?;

            let new_invitation = NewInvitation {
                code: &invite_code,
                inviter_name: &user.name,
                email,
                words,
            };

            if user.invitation_credit > 0 {
                // XXX: 使用 transaction
                let target = schema::users::table.find(id);
                use schema::{users, invitations};
                diesel::update(target)
                    .set(users::invitation_credit.eq(users::invitation_credit - 1))
                    .execute(conn)?;
                diesel::insert_into(invitations::table)
                    .values(&new_invitation)
                    .execute(conn)?;
                Ok(invite_code)
            } else {
                Err(Error::new_logic("邀請點數不足", 403))
            }
        }
        None => {
            let new_invitation = NewInvitation {
                code: &invite_code,
                inviter_name: "",
                email,
                words,
            };
            diesel::insert_into(schema::invitations::table)
                .values(&new_invitation)
                .execute(conn)?;
            Ok(invite_code)
        }
    }
}

pub fn create_user_by_invitation(
    conn: &PgConnection,
    code: &str,
    name: &str,
    password: &str,
) -> Fallible<User> {
    // TODO: 錯誤處理
    let invitation = schema::invitations::table
        .filter(schema::invitations::code.eq(code))
        .first::<Invitation>(conn)
        .or(Err(Error::new_logic(format!("查無邀請碼: {}", code), 404)))?;
    let mut invitation_credit = 0;
    let config = CONFIG.get();
    if invitation.inviter_name == "" {
        invitation_credit = config.user.invitation_credit;
    }
    diesel::update(schema::invitations::table.filter(schema::invitations::code.eq(code)))
        .set(schema::invitations::is_used.eq(true))
        .execute(conn)?;
    create_user(&conn, &invitation.email, name, password, invitation_credit)
}

pub fn create_user(
    conn: &PgConnection,
    email: &str,
    name: &str,
    password: &str,
    invitation_credit: i32,
) -> Fallible<User> {
    let salt = rand::thread_rng().gen::<[u8; 16]>();

    let hash = argon2::hash_raw(password.as_bytes(), &salt, &argon2::Config::default()).unwrap();

    let new_user = NewUser {
        name,
        email,
        invitation_credit,
        password_hashed: hash.to_vec(),
        salt: salt.to_vec(),
    };
    diesel::insert_into(schema::users::table)
        .values(&new_user)
        .get_result(conn)
        .map_err(|e| e.into())
}
