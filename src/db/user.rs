use super::{get_pool, DBObject, ToFallible};
use crate::api::model::User;
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use rand::{distributions::Alphanumeric, Rng};

impl DBObject for User {
    const TYPE: DataType = DataType::User;
}

// XXX: 密切關注 sqlx user defined macro
// XXX: 密切關注 sqlx 什麼時候能把 COUNT(*) 判斷為非空
macro_rules! users {
    ($remain:literal, $($arg:expr),*) => {
        sqlx::query_as!(
            User,
            r#"
            WITH metas AS (SELECT
                users.id,
                users.user_name,
                users.sentence,
                users.energy,
                users.introduction,
                users.gender,
                users.job,
                users.city,
                (
                SELECT
                    COUNT(*)
                FROM
                    user_relations
                WHERE
                    to_user = users.id
                    AND (kind = 'hate'
                    OR kind = 'openly_hate')) AS "hated_count!",
                (
                SELECT
                    COUNT(*)
                FROM
                    user_relations
                WHERE
                    to_user = users.id
                    AND (kind = 'follow'
                    OR kind = 'openly_follow')) AS "followed_count!",
                (
                SELECT
                    COUNT(*)
                FROM
                    user_relations
                WHERE
                    from_user = users.id
                    AND (kind = 'hate'
                    OR kind = 'openly_hate')) AS "hating_count!",
                (
                SELECT
                    COUNT(*)
                FROM
                    user_relations
                WHERE
                    from_user = users.id
                    AND (kind = 'follow'
                    OR kind = 'openly_follow')) AS "following_count!"
            FROM users) SELECT * FROM metas "# + $remain,
            $($arg),*
        )
    };
}

pub async fn get_by_id(id: i64) -> Fallible<User> {
    let pool = get_pool();
    let user = users!("WHERE metas.id = $1", id)
        .fetch_one(pool)
        .await
        .to_fallible(id)?;
    Ok(user)
}

pub async fn email_used(email: &str) -> Fallible<bool> {
    let pool = get_pool();
    let arr = sqlx::query!("SELECT 1 as t from users where email = $1 LIMIT 1", email)
        .fetch_all(pool)
        .await?;
    Ok(arr.len() != 0)
}

pub async fn get_by_name(name: &str) -> Fallible<User> {
    let pool = get_pool();
    let user = users!("WHERE metas.user_name = $1", name)
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
    .fetch_optional(pool)
    .await?
    .ok_or(ErrorCode::PermissionDenied.context("密碼錯誤"))?;
    let equal = argon2::verify_raw(
        password.as_bytes(),
        &record.salt,
        &record.password_hashed,
        &argon2::Config::default(),
    )?;
    if equal {
        get_by_name(name).await
    } else {
        Err(ErrorCode::PermissionDenied.context("查無使用者"))
    }
}

pub async fn update_sentence(id: i64, sentence: String) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "
        UPDATE users
        SET sentence = $1
        WHERE id = $2
        ",
        sentence,
        id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_info(
    id: i64,
    introduction: String,
    gender: String,
    job: String,
    city: String,
) -> Fallible<()> {
    let pool = get_pool();
    sqlx::query!(
        "
        UPDATE users
        SET (introduction, gender, job, city) = ($2, $3, $4, $5)
        WHERE id = $1
        ",
        id,
        introduction,
        gender,
        job,
        city
    )
    .execute(pool)
    .await?;
    Ok(())
}
