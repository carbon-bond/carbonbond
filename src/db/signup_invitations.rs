use super::get_pool;
use crate::api::model::SignupInvitation;
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use chrono::{DateTime, Utc};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use sqlx::PgConnection;

pub async fn query_signup_invitation(from_user: i64) -> Fallible<Vec<SignupInvitation>> {
    let pool = get_pool();
    let tickets: Vec<SignupInvitation> = sqlx::query_as!(
        SignupInvitation,
        r#"
		SELECT * FROM signup_invitations
		WHERE signup_invitations.from_user = $1;"#,
        from_user
    )
    .fetch_all(pool)
    .await?;
    Ok(tickets)
}

pub async fn add_signup_invitation(from_user: i64, description: &String) -> Fallible<i64> {
    let pool = get_pool();
    let id = sqlx::query!(
        "INSERT INTO signup_invitations (from_user, description)
        VALUES ($1, $2) RETURNING id",
        from_user,
        description
    )
    .fetch_one(pool)
    .await?
    .id;
    Ok(id)
}

pub async fn activate_signup_invitation(signup_invitation_id: i64) -> Fallible<String> {
    let pool = get_pool();
    // step 1. if code === NULL, generate code
    let rand_string: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(16)
        .map(char::from)
        .collect();
    sqlx::query!(
        "UPDATE signup_invitations SET code = $1, last_activate_time = $2 where id = $3",
        rand_string,
        Utc::now(),
        signup_invitation_id
    )
    .execute(pool)
    .await?;
    // step 2. update last_activate_time to current time
    return Ok(rand_string);
}

pub async fn deactivate_signup_invitation(signup_invitation_id: i64) -> Fallible {
    let pool = get_pool();
    let no1: Option<String> = None;
    let no2: Option<DateTime<Utc>> = None;
    sqlx::query!(
        "UPDATE signup_invitations SET code = $1, last_activate_time = $2 where id = $3",
        no1,
        no2,
        signup_invitation_id
    )
    .execute(pool)
    .await?;
    Ok(())
}
