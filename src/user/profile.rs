use diesel::prelude::*;
use base64;
use crate::db::{schema};
use crate::custom_error::{Fallible};
use crate::image::save_image;

pub fn update_profile(conn: &PgConnection, user_id: i64, avatar: String) -> Fallible<bool> {
    use schema::{users, images};

    let user = crate::user::find_user_by_id(conn, user_id)?;

    match user.avatar {
        Some(image_id) => {
            diesel::update(images::table.find(image_id))
                .set(images::raw_data.eq(base64::decode(&avatar)?))
                .execute(conn)?;
        },
        None => {
            let image_id = save_image(conn, &avatar)?;

            diesel::update(users::table.find(user.id))
                .set(users::avatar.eq(image_id))
                .execute(conn)?;
        }
    }


    Ok(true)
}
