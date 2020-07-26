use super::{get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};

#[derive(Debug, Default)]
pub struct User {
    pub name: String,
    pub id: i64,
    pub email: String,
    pub energy: i32,
    pub sentence: String,
    pub avatar: Option<i64>,
    pub invitation_credit: i32,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
    pub create_time: Option<chrono::DateTime<chrono::Utc>>,
}
impl DBObject for User {
    const TYPE: DataType = DataType::User;
}

pub async fn get_by_id(id: i64) -> Fallible<User> {
    let pool = get_pool();
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_one(pool)
        .await
        .to_fallible(id)?;
    Ok(user)
}

pub async fn get_by_name(name: &str) -> Fallible<User> {
    let pool = get_pool();
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE name = $1", name)
        .fetch_one(pool)
        .await
        .to_fallible(name)?;
    Ok(user)
}

pub async fn signup(name: &str, password: &str, email: &str) -> Fallible<i64> {
    use rand::Rng;
    let salt = rand::thread_rng().gen::<[u8; 16]>();
    let hash = argon2::hash_raw(password.as_bytes(), &salt, &argon2::Config::default())?;
    log::trace!("生成使用者 {}:{} 的鹽及雜湊", name, email);
    let pool = get_pool();
    let res = sqlx::query!(
        "INSERT INTO users (name, password_hashed, salt, email) VALUES ($1, $2, $3, $4) RETURNING id",
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
    let user = get_by_name(name).await?;
    let equal = argon2::verify_raw(
        password.as_bytes(),
        &user.salt,
        &user.password_hashed,
        &argon2::Config::default(),
    )?;
    if equal {
        Ok(user)
    } else {
        Err(Error::new_logic(ErrorCode::PermissionDenied, "密碼錯誤"))
    }
}
