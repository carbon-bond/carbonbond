use super::get_pool;
use crate::api::model::forum::{UserMini, UserRelation, UserRelationKind};
use crate::custom_error::Fallible;
use std::str::FromStr;
use std::string::ToString;

pub async fn create_relation(relation: &UserRelation) -> Fallible<()> {
    log::trace!("創造用戶關係");
    let pool = get_pool();
    sqlx::query!(
        "INSERT INTO user_relations (from_user, to_user, kind, is_public) VALUES ($1, $2, $3::text::user_relation_kind, $4)
        on CONFLICT(from_user, to_user) DO UPDATE set kind=$3::text::user_relation_kind, is_public=$4",
        relation.from_user,
        relation.to_user,
        relation.kind.to_string(),
        relation.is_public
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

pub async fn query_relation(from_user: i64, to_user: i64) -> Fallible<UserRelation> {
    log::trace!("調查用戶關係");
    let pool = get_pool();
    pub struct DBUserRelationKind {
        pub kind: String,
        pub is_public: bool,
    }
    let relation = sqlx::query_as_unchecked!(
        DBUserRelationKind,
        "SELECT kind, is_public FROM user_relations WHERE from_user = $1 AND to_user = $2",
        from_user,
        to_user,
    )
    .fetch_optional(pool)
    .await?;
    if let Some(relation) = relation {
        Ok(UserRelation {
            from_user,
            to_user,
            kind: UserRelationKind::from_str(&relation.kind)?,
            is_public: relation.is_public,
        })
    } else {
        Ok(UserRelation {
            from_user,
            to_user,
            kind: UserRelationKind::from_str("none")?,
            is_public: false,
        })
    }
}

pub async fn query_follower(to_user: i64) -> Fallible<Vec<UserMini>> {
    let pool = get_pool();
    let followers: Vec<UserMini> = sqlx::query_as!(
        UserMini,
        r#"
		SELECT users.id, users.user_name, users.sentence, users.energy FROM users
		INNER JOIN user_relations ON users.id = user_relations.from_user
		WHERE user_relations.to_user = $1 AND user_relations.kind = 'follow' AND user_relations.is_public = true;"#,
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
		WHERE user_relations.to_user = $1 AND user_relations.kind = 'hate' AND user_relations.is_public = true;"#,
        to_user
    )
    .fetch_all(pool)
    .await?;
    Ok(followers)
}

pub async fn query_following(from_user: i64, is_public: bool) -> Fallible<Vec<UserMini>> {
    let pool = get_pool();
    let followings: Vec<UserMini> = sqlx::query_as!(
        UserMini,
        r#"
		SELECT users.id, users.user_name, users.sentence, users.energy FROM users
		INNER JOIN user_relations ON users.id = user_relations.to_user
		WHERE user_relations.from_user = $1 AND user_relations.kind = 'follow' AND user_relations.is_public = $2;"#,
        from_user,
        is_public
    )
    .fetch_all(pool)
    .await?;
    Ok(followings)
}

pub async fn query_hating(from_user: i64, is_public: bool) -> Fallible<Vec<UserMini>> {
    let pool = get_pool();
    let hatings: Vec<UserMini> = sqlx::query_as!(
        UserMini,
        r#"
		SELECT users.id, users.user_name, users.sentence, users.energy FROM users
		INNER JOIN user_relations ON users.id = user_relations.to_user
		WHERE user_relations.from_user = $1 AND user_relations.kind = 'hate' AND user_relations.is_public = $2;"#,
        from_user,
        is_public
    )
    .fetch_all(pool)
    .await?;
    Ok(hatings)
}
