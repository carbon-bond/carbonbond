use actix_web::{HttpResponse, web};
use actix_web::dev::Body;
use crate::{user, db};
use std::fs::File;
use std::io::Read;


pub fn no_avatar() -> HttpResponse {
    let f = File::open("./frontend/static/img/no-avatar.png");
    match f {
        Ok(mut f) => {
            let mut data = Vec::new();
            match f.read_to_end(&mut data) {
                Ok(_) => {
                    HttpResponse::Found().body(Body::from_slice(&data))
                },
                Err(_) => HttpResponse::InternalServerError().finish()
            }
        },
        Err(_) => HttpResponse::InternalServerError().finish()
    }
}

pub fn avatar(path: web::Path<(String,)>) -> HttpResponse {
    let user_name = &path.0;

    let conn = match db::connect_db() {
        Ok(c) => c,
        Err(_) => {
            return HttpResponse::InternalServerError().finish();
        }
    };

    let u = user::find_user_by_name(&conn, user_name);

    match u {
        Err(_) => {
            return HttpResponse::NotFound().finish();
        }
        Ok(u) => {
            if let Some(image) = u.avatar {
                let response = HttpResponse::Found().body(Body::from_slice(&image));
                return response;
            } else {
                return no_avatar();
            }
        }
    }
}
