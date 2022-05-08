use reqwest::redirect::Attempt;
use sqlx::PgConnection;

use super::get_pool;
use crate::{api::model::forum::Attitude, custom_error::Fallible};

async fn increase_good(conn: &mut PgConnection, article_id: i64, amount: i64) -> Fallible<()> {
    super::article::update_energy(conn, article_id, amount).await?;
    sqlx::query!(
        "
        UPDATE articles
        SET
            good = good + $1
        WHERE id = $2
        ",
        amount,
        article_id
    )
    .execute(conn)
    .await?;
    Ok(())
}

async fn increase_bad(conn: &mut PgConnection, article_id: i64, amount: i64) -> Fallible<()> {
    super::article::update_energy(conn, article_id, -amount).await?;
    sqlx::query!(
        "
        UPDATE articles
        SET
            bad = bad + $1
        WHERE id = $2
        ",
        amount,
        article_id
    )
    .execute(conn)
    .await?;
    Ok(())
}

impl Attitude {
    fn to_bool(self) -> Option<bool> {
        match self {
            Attitude::Bad => Some(false),
            Attitude::Good => Some(true),
            _ => None,
        }
    }
}

pub async fn set_attitude(
    user_id: i64,
    article_id: i64,
    attitude: Attitude,
) -> Fallible<(i64, i64)> {
    let mut conn = get_pool().begin().await?;
    let attitude_now = sqlx::query!(
        "
        SELECT id, attitude FROM attitude_to_articles
        WHERE user_id = $1 and article_id = $2
        ",
        user_id,
        article_id,
    )
    .fetch_optional(&mut conn)
    .await?;

    let attitude_id = attitude_now.as_ref().map(|a| a.id).clone();
    let attitude_now = attitude_now.map(|a| a.attitude);
    let attitude_next = attitude.to_bool();

    if let Some(attitude_now) = attitude_now {
        sqlx::query!(
            "
            DELETE FROM attitude_to_articles
            WHERE id = $1
            ",
            attitude_id
        )
        .execute(&mut conn)
        .await?;
        if attitude_now {
            increase_good(&mut conn, article_id, -1).await?;
        } else {
            increase_bad(&mut conn, article_id, -1).await?;
        }
    }

    if let Some(attitude_next) = attitude_next {
        sqlx::query!(
            "
            INSERT INTO attitude_to_articles (user_id, article_id, attitude)
            VALUES ($1, $2, $3) RETURNING id
            ",
            user_id,
            article_id,
            attitude_next
        )
        .fetch_one(&mut conn)
        .await?;
        if attitude_next {
            increase_good(&mut conn, article_id, 1).await?;
        } else {
            increase_bad(&mut conn, article_id, 1).await?;
        }
    }

    let attitude_count = sqlx::query!(
        "
        SELECT good, bad FROM articles
        WHERE id = $1
        ",
        article_id
    )
    .fetch_one(&mut conn)
    .await?;
    conn.commit().await?;
    Ok((attitude_count.good, attitude_count.bad))
}
