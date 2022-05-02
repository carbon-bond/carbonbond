use sqlx::PgConnection;

use super::get_pool;
use crate::{api::model::forum::Attitude, custom_error::Fallible};

async fn increase_good(conn: &mut PgConnection, article_id: i64, amount: i64) -> Fallible<()> {
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

    match attitude_now {
        None => {
            if attitude != Attitude::None {
                let bool_attitude = if attitude == Attitude::Good {
                    true
                } else {
                    false
                };
                sqlx::query!(
                    "
                    INSERT INTO attitude_to_articles (user_id, article_id, attitude)
                    VALUES ($1, $2, $3) RETURNING id
                    ",
                    user_id,
                    article_id,
                    bool_attitude
                )
                .fetch_one(&mut conn)
                .await?;
                if bool_attitude {
                    increase_good(&mut conn, article_id, 1).await?;
                    super::article::update_energy(&mut conn, article_id, 1).await?;
                } else {
                    increase_bad(&mut conn, article_id, 1).await?;
                    super::article::update_energy(&mut conn, article_id, -1).await?;
                }
            }
        }
        Some(a) => {
            if attitude == Attitude::Good && a.attitude == false {
                sqlx::query!(
                    "
                    UPDATE attitude_to_articles
                    SET attitude = TRUE
                    WHERE id = $1
                    ",
                    a.id
                )
                .execute(&mut conn)
                .await?;
                increase_good(&mut conn, article_id, 1).await?;
                increase_bad(&mut conn, article_id, -1).await?;
                super::article::update_energy(&mut conn, article_id, 2).await?;
            } else if attitude == Attitude::Bad && a.attitude == true {
                sqlx::query!(
                    "
                    UPDATE attitude_to_articles
                    SET attitude = FALSE
                    WHERE id = $1
                    ",
                    a.id
                )
                .execute(&mut conn)
                .await?;
                increase_good(&mut conn, article_id, -1).await?;
                increase_bad(&mut conn, article_id, 1).await?;
                super::article::update_energy(&mut conn, article_id, -2).await?;
            } else {
                sqlx::query!(
                    "
                    DELETE FROM attitude_to_articles
                    WHERE id = $1
                    ",
                    a.id
                )
                .execute(&mut conn)
                .await?;
                if a.attitude {
                    increase_good(&mut conn, article_id, -1).await?;
                    super::article::update_energy(&mut conn, article_id, -1).await?;
                } else {
                    increase_bad(&mut conn, article_id, -1).await?;
                    super::article::update_energy(&mut conn, article_id, 1).await?;
                }
            }
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
