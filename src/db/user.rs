use super::{get_pool, DBObject, ToFallible};
use crate::api::model::{User, UserRelation, UserRelationKind};
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
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
        "SELECT id, name as user_name, sentence, invitation_credit, 0 as energy,
        (SELECT COUNT(*) FROM user_relations WHERE to_user=users.id AND (kind='hate' OR kind='openly_hate' )) as hated_count,
        (SELECT COUNT(*) FROM user_relations WHERE to_user=users.id AND kind='follow') as followed_count,
        (SELECT COUNT(*) FROM user_relations WHERE from_user=users.id AND (kind='hate' OR kind='openly_hate' )) as hating_count,
        (SELECT COUNT(*) FROM user_relations WHERE from_user=users.id AND kind='follow') as following_count
        FROM users WHERE id = $1",
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
        "SELECT id, name as user_name, sentence, invitation_credit, 0 as energy,
        (SELECT COUNT(*) FROM user_relations WHERE to_user=users.id AND (kind='hate' OR kind='openly_hate' )) as hated_count,
        (SELECT COUNT(*) FROM user_relations WHERE to_user=users.id AND kind='follow') as followed_count,
        (SELECT COUNT(*) FROM user_relations WHERE from_user=users.id AND (kind='hate' OR kind='openly_hate' )) as hating_count,
        (SELECT COUNT(*) FROM user_relations WHERE from_user=users.id AND kind='follow') as following_count
        FROM users WHERE name = $1",
        name
    )
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
    let pool = get_pool();
    let record = sqlx::query!(
        "SELECT salt, password_hashed from users WHERE name = $1",
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
