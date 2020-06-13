use actix_web::{HttpResponse, web};
use actix_web::dev::Body;
use crate::db::{models, schema};
use crate::db;
use diesel::pg::PgConnection;
use std::fs::File;
use std::io::Read;
use crate::custom_error::{Fallible};
use base64;
use diesel::prelude::*;

pub fn save_image(conn: &PgConnection, data: &str) -> Fallible<i64> {
    let new_image = models::NewImage {
        raw_data: base64::decode(data)?,
    };
    let image: models::Image = diesel::insert_into(schema::images::table)
        .values(&new_image)
        .get_result(conn)?;
    Ok(image.id)
}

pub fn no_avatar() -> HttpResponse {
    let f = File::open("./frontend/static/img/no-avatar.png");
    match f {
        Ok(mut f) => {
            let mut data = Vec::new();
            match f.read_to_end(&mut data) {
                Ok(_) => HttpResponse::Found().body(Body::from_slice(&data)),
                Err(_) => HttpResponse::InternalServerError().finish(),
            }
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub fn get_avatar(path: web::Path<(String,)>) -> HttpResponse {
    let user_name = &path.0;

    let conn = match db::connect_db() {
        Ok(c) => c,
        Err(_) => {
            return HttpResponse::InternalServerError().finish();
        }
    };

    let u = crate::user::find_user_by_name(&conn, user_name);

    match u {
        Err(_) => {
            // 沒有這個使用者
            return HttpResponse::NotFound().finish();
        }
        Ok(u) => {
            if let Some(image_id) = u.avatar {
                // 有使用者，有頭貼
                use schema::{images};
                let avatar = images::table.find(image_id).first::<models::Image>(&conn);

                match avatar {
                    Err(_) => {
                        return HttpResponse::InternalServerError().finish();
                    }
                    Ok(avatar) => {
                        return HttpResponse::Found().body(Body::from_slice(&avatar.raw_data));
                    }
                }
            } else {
                // 有這個使用者，但它沒有設頭貼，回傳預設的
                return no_avatar();
            }
        }
    }
}
