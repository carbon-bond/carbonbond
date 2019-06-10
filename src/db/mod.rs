use argon2rs;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use dotenv::dotenv;
use std::env;
use rand::Rng;

pub mod models;
pub mod schema;
use models::{NewUser, User, NewInvitation, Invitation};

use schema::{invitations, users};

pub fn connect_db() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("未設定資料庫位址");
    PgConnection::establish(&database_url)
        .expect(&format!("連線至 {} 時發生錯誤", database_url))
}

pub fn delete_all(conn: &PgConnection) {
    diesel::delete(users::table)
        .execute(conn)
        .expect("刪除 users 失敗");
    diesel::delete(invitations::table)
        .execute(conn)
        .expect("刪除 invitations 失敗");
}

pub fn create_invitation(conn: &PgConnection, sender: Option<&str>, email: &str) -> Option<String> {
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
            let user = schema::users::table
                .find(id)
                .first::<User>(conn)
                .expect("搜尋 id 失敗");
            if user.invitation_credit > 0 {
                // XXX: 使用 transaction
                let target = schema::users::table.find(id);
                use schema::users::dsl::*;
                diesel::update(target)
                    .set(invitation_credit.eq(invitation_credit - 1))
                    .execute(conn)
                    .expect("減少邀請點數失敗");
                diesel::insert_into(invitations::table)
                    .values(&new_invitation)
                    .execute(conn)
                    .expect("新增邀請失敗");
                Some(invite_code)
            } else {
                None
            }
        }
        None => {
            diesel::insert_into(invitations::table)
                .values(&new_invitation)
                .execute(conn)
                .expect("新增邀請失敗");
            Some(invite_code)
        }
    }
}

pub fn create_user_by_invitation(
    conn: &PgConnection,
    code: &str,
    id: &str,
    password: &str,
) -> User {
    // TODO: 錯誤處理
    let invitation = invitations::table
        .filter(invitations::code.eq(code))
        .first::<Invitation>(conn)
        .expect("邀請碼不存在");

    let salt: String = rand::thread_rng().gen::<[char; 32]>().into_iter().collect();
    let password_array = argon2rs::argon2i_simple(&password, &salt[..]);

    let new_user = NewUser {
        id,
        email: &invitation.email,
        password_bytes: password_array.iter().map(|ch| *ch as u8).collect(),
        salt: salt.chars().map(|ch| ch as u8).collect(),
    };
    diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn)
        .expect("新增使用者失敗")
}

pub fn create_user(conn: &PgConnection, email: &str, id: &str, password: &str) -> User {
    let salt: String = rand::thread_rng().gen::<[char; 32]>().into_iter().collect();
    let password_array = argon2rs::argon2i_simple(&password, &salt[..]);
    let new_user = NewUser {
        id,
        email,
        password_bytes: password_array.iter().map(|ch| *ch as u8).collect(),
        salt: salt.chars().map(|ch| ch as u8).collect(),
    };
    diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn)
        .expect("新增使用者失敗")
}
