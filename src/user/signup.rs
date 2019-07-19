use diesel::pg::PgConnection;
use diesel::prelude::*;
use rand::Rng;
use crate::db::models::{NewUser, User, NewInvitation, Invitation};
use crate::db::schema;
use crate::custom_error::Error;

// 回傳邀請碼
pub fn create_invitation(
    conn: &PgConnection,
    sender: Option<&str>,
    email: &str,
) -> Result<String, Error> {
    use rand::distributions::Alphanumeric;

    let invite_code: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect();

    let new_invitation = NewInvitation {
        code: &invite_code,
        email,
    };

    match sender {
        Some(id) => {
            let user =
                schema::users::table
                    .find(id)
                    .first::<User>(conn)
                    .or(Err(Error::new_logic(
                        &format!("查無使用者: {}", id),
                        403,
                    )))?;
            if user.invitation_credit > 0 {
                // XXX: 使用 transaction
                let target = schema::users::table.find(id);
                use schema::users::dsl::*;
                diesel::update(target)
                    .set(invitation_credit.eq(invitation_credit - 1))
                    .execute(conn)
                    .or(Err(Error::new_internal("修改邀請點失敗")))?;
                diesel::insert_into(schema::invitations::table)
                    .values(&new_invitation)
                    .execute(conn)
                    .or(Err(Error::new_internal("新增邀請失敗")))?;
                Ok(invite_code)
            } else {
                Err(Error::new_logic("邀請點數不足", 403))
            }
        }
        None => {
            diesel::insert_into(schema::invitations::table)
                .values(&new_invitation)
                .execute(conn)
                .or(Err(Error::new_internal("新增邀請失敗")))?;
            Ok(invite_code)
        }
    }
}

pub fn create_user_by_invitation(
    conn: &PgConnection,
    code: &str,
    id: &str,
    password: &str,
) -> Result<User, Error> {
    // TODO: 錯誤處理
    let invitation = schema::invitations::table
        .filter(schema::invitations::code.eq(code))
        .first::<Invitation>(conn)
        .or(Err(Error::new_logic(
            &format!("查無邀請碼: {}", code),
            404,
        )))?;

    create_user(conn, &invitation.email, id, password)
}

// NOTE: 伺服器尚未用到該函式，是 db-tool 在用
// TODO: 錯誤處理
pub fn create_user(
    conn: &PgConnection,
    email: &str,
    id: &str,
    password: &str,
) -> Result<User, Error> {
    let salt = rand::thread_rng().gen::<[u8; 16]>();

    let hash = argon2::hash_raw(password.as_bytes(), &salt, &argon2::Config::default()).unwrap();

    let new_user = NewUser {
        id,
        email,
        password_hashed: hash.to_vec(),
        salt: salt.to_vec(),
    };
    diesel::insert_into(schema::users::table)
        .values(&new_user)
        .get_result(conn)
        .or(Err(Error::new_internal("新增用戶失敗")))
}
