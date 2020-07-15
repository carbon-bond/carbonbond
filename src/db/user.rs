use super::{get_pool, DBObject, ToFallible};
use crate::custom_error::{DataType, Error, Fallible};

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

pub async fn get_by_name(name: &str) -> Fallible<User> {
    let pool = get_pool();
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE name = $1", name)
        .fetch_one(pool)
        .await
        .to_fallible(name)?;
    Ok(user)
}

pub async fn create(user: &User) -> Fallible<i64> {
    let pool = get_pool();
    let res = sqlx::query!(
        "INSERT INTO users (name, password_hashed, salt, email, sentence) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        user.name,
        user.password_hashed,
        user.salt,
        user.email,
        user.sentence
    )
    .fetch_one(pool)
    .await?;
    Ok(res.id)
}

pub async fn signup(name: &str, password: &str, email: &str) -> Fallible<i64> {
    use rand::Rng;
    let salt = rand::thread_rng().gen::<[u8; 16]>();

    let hash = argon2::hash_raw(password.as_bytes(), &salt, &argon2::Config::default())?;
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
        Err(Error::new_other("密碼錯誤"))
    }
}
