use actix_web::{HttpResponse, web};
use actix_web::dev::Body;
use crate::{user, db};

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
                return HttpResponse::NotFound().finish();
            }
        }
    }
}
