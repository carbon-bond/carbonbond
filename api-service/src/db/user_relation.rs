use super::get_pool;
use crate::api::model::forum::{UserMini, UserRelation, UserRelationKind};
use crate::custom_error::Fallible;
use std::str::FromStr;
use std::string::ToString;

pub async fn create_relation(relation: &UserRelation) -> Fallible<()> {
    log::trace!("創造用戶關係");
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO user_relations (from_user, to_user, kind) VALUES ($1, $2, $3::text::user_relation_kind)
        on CONFLICT(from_user, to_user) DO UPDATE set kind=$3::text::user_relation_kind",
        relation.from_user,
        relation.to_user,
        relation.kind.to_string()
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_relation(from_user: i64, to_user: i64) -> Fallible<()> {
    log::trace!("移除用戶關係");
    let pool = get_pool();
    sqlx::query!(
        "DELETE FROM user_relations WHERE from_user = $1 AND to_user = $2",
        from_user,
        to_user,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn query_relation(from_user: i64, to_user: i64) -> Fallible<UserRelationKind> {
    log::trace!("調查用戶關係");
    let pool = get_pool();
    pub struct DBUserRelationKind {
        pub kind: String,
    }
    let relation = sqlx::query_as_unchecked!(
        DBUserRelationKind,
        "SELECT kind FROM user_relations WHERE from_user = $1 AND to_user = $2",
        from_user,
        to_user,
    )
    .fetch_optional(pool)
    .await?;
    if let Some(relation) = relation {
        Ok(UserRelationKind::from_str(&relation.kind)?)
    } else {
        Ok(UserRelationKind::from_str("none")?)
    }
}

pub async fn query_follower(to_user: i64) -> Fallible<Vec<UserMini>> {
    let pool = get_pool();
    let followers: Vec<UserMini> = sqlx::query_as!(
        UserMini,
        r#"
		SELECT users.id, users.user_name, users.sentence, users.energy FROM users
		INNER JOIN user_relations ON users.id = user_relations.from_user
		WHERE user_relations.to_user = $1 AND user_relations.kind = 'openly_follow';"#,
        to_user
    )
    .fetch_all(pool)
    .await?;
    Ok(followers)
}

pub async fn query_hater(to_user: i64) -> Fallible<Vec<UserMini>> {
    let pool = get_pool();
    let followers: Vec<UserMini> = sqlx::query_as!(
        UserMini,
        r#"
		SELECT users.id, users.user_name, users.sentence, users.energy FROM users
		INNER JOIN user_relations ON users.id = user_relations.from_user
		WHERE user_relations.to_user = $1 AND user_relations.kind = 'openly_hate';"#,
        to_user
    )
    .fetch_all(pool)
    .await?;
    Ok(followers)
}
