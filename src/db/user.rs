use super::{get_pool, DBObject, ToFallible};
use crate::api::model::{User, UserRelation, UserRelationKind};
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use rand::{distributions::Alphanumeric, Rng};
use sqlx::{
    encode::Encode,
    postgres::{PgRawBuffer, PgTypeInfo},
};

impl DBObject for User {
    const TYPE: DataType = DataType::User;
}

pub async fn get_by_id(id: i64) -> Fallible<User> {
    let pool = get_pool();
    let user = sqlx::query_as!(
        User,
        "SELECT * from user_with_relations() as u where u.id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .to_fallible(id)?;
    Ok(user)
}

pub async fn get_by_name(name: &str) -> Fallible<User> {
    let pool = get_pool();
    let user = sqlx::query_as!(
        User,
        "SELECT * from user_with_relations() as u where u.user_name = $1",
        name
    )
    .fetch_one(pool)
    .await
    .to_fallible(name)?;
    Ok(user)
}

pub async fn get_signup_token(email: &str) -> Fallible<Option<String>> {
    let pool = get_pool();
    let record = sqlx::query!("SELECT token FROM signup_tokens WHERE email = $1", email)
        .fetch_optional(pool)
        .await?;
    Ok(record.map(|r| r.token))
}
pub async fn create_signup_token(email: &str) -> Fallible<String> {
    let pool = get_pool();
    let token = loop {
        let token = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(20)
            .collect::<String>();
        if get_email_by_token(&token).await?.is_none() {
            break token;
        }
    };
    sqlx::query!(
        "INSERT INTO signup_tokens (email, token) VALUES ($1, $2)",
        email,
        token
    )
    .execute(pool)
    .await?;
    Ok(token)
}
pub async fn get_email_by_token(token: &str) -> Fallible<Option<String>> {
    let pool = get_pool();
    let record = sqlx::query!("SELECT email FROM signup_tokens WHERE token = $1", token)
        .fetch_optional(pool)
        .await?;
    Ok(record.map(|r| r.email))
}
pub async fn signup_with_token(name: &str, password: &str, token: &str) -> Fallible<i64> {
    log::trace!("使用者用註冊碼註冊");
    let email = get_email_by_token(token).await?;
    if let Some(email) = email {
        let pool = get_pool();
        let id = signup(name, password, &email).await?;
        sqlx::query!("DELETE FROM signup_tokens WHERE token = $1", token)
            .execute(pool)
            .await?;
        Ok(id)
    } else {
        Err(ErrorCode::NotFound(DataType::SignupToken, token.to_owned()).into())
    }
}
pub async fn signup(name: &str, password: &str, email: &str) -> Fallible<i64> {
    let salt = rand::thread_rng().gen::<[u8; 16]>();
    let hash = argon2::hash_raw(password.as_bytes(), &salt, &argon2::Config::default())?;
    log::trace!("生成使用者 {}:{} 的鹽及雜湊", name, email);
    let pool = get_pool();
    let res = sqlx::query!(
        "INSERT INTO users (user_name, password_hashed, salt, email) VALUES ($1, $2, $3, $4) RETURNING id",
        name,
        hash,
        salt.to_vec(),
        email,
    )
    .fetch_one(pool)
    .await?;
    log::trace!("成功新增使用者 {}:{}", name, email);
    Ok(res.id)
}

pub async fn login(name: &str, password: &str) -> Fallible<User> {
    let pool = get_pool();
    let record = sqlx::query!(
        "SELECT salt, password_hashed from users WHERE user_name = $1",
        name
    )
    .fetch_one(pool)
    .await?;
    let equal = argon2::verify_raw(
        password.as_bytes(),
        &record.salt,
        &record.password_hashed,
        &argon2::Config::default(),
    )?;
    if equal {
        get_by_name(name).await
    } else {
        Err(Error::new_logic(ErrorCode::PermissionDenied, "密碼錯誤"))
    }
}

impl sqlx::Type<sqlx::Postgres> for UserRelationKind {
    fn type_info() -> PgTypeInfo {
        PgTypeInfo::with_name("USER_RELATION_KIND")
    }
}
impl Encode<sqlx::Postgres> for UserRelationKind {
    fn encode(&self, buf: &mut PgRawBuffer) {
        use std::io::Write;
        write!(&mut *buf, "{}", self).unwrap();
    }
}
pub async fn create_relation(relation: &UserRelation) -> Fallible {
    log::trace!("創造用戶關係");
    let pool = get_pool();
    sqlx::query_unchecked!(
        "INSERT INTO user_relations (from_user, to_user, kind) VALUES ($1, $2, $3)
        on CONFLICT(from_user, to_user) DO UPDATE set kind=$3",
        relation.from_user,
        relation.to_user,
        relation.kind
    )
    .execute(pool)
    .await?;
    Ok(())
}
