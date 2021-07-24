use super::get_pool;
use crate::custom_error::Fallible;
use base64::decode;

struct IDWrap {
    id: i64,
}

pub async fn get_avatar(user_name: &str) -> Fallible<hyper::Body> {
    let pool = get_pool();
    let image = sqlx::query!(
        "
        SELECT images.raw_data
        FROM images
        INNER JOIN users
        ON users.avatar = images.id
        where users.user_name = $1
        ",
        user_name,
    )
    .fetch_optional(pool)
    .await?;

    if let Some(image) = image {
        Ok(hyper::Body::from(image.raw_data))
    } else {
        let image = std::fs::read("./frontend/src/img/no-avatar.png").expect("讀取預設大頭貼失敗");
        Ok(hyper::Body::from(image))
    }
}

pub async fn update_avatar(user_id: i64, image: String) -> Fallible<()> {
    let pool = get_pool();
    // NOTE: 這個應用場景不用 transaction 似乎也沒差...
    let image_id = sqlx::query_as!(
        IDWrap,
        "SELECT images.id
        FROM images
        INNER JOIN users
        ON users.avatar = images.id
        WHERE users.id = $1",
        user_id
    )
    .fetch_optional(pool)
    .await?;

    let img = decode(image)?;

    if let Some(IDWrap { id }) = image_id {
        sqlx::query!(
            "UPDATE images
            SET raw_data = $1
            WHERE images.id = $2",
            img,
            id
        )
        .execute(pool)
        .await?;
    } else {
        let id = sqlx::query_as!(
            IDWrap,
            "
            INSERT INTO images (raw_data)
            VALUES ($1)
            RETURNING images.id
            ",
            img
        )
        .fetch_one(pool)
        .await?
        .id;
        sqlx::query!(
            "
            UPDATE users 
            SET avatar = $1
            WHERE users.id = $2
            ",
            id,
            user_id
        )
        .execute(pool)
        .await?;
    }

    Ok(())
}
