extern crate actix_web;
extern crate actix_files;
extern crate actix_rt;
extern crate env_logger;
extern crate juniper;
#[macro_use]
extern crate diesel;
extern crate serde_json;

mod api;
mod db;
mod email;
mod login;
mod signup;
mod custom_error;

use std::sync::{Arc, Mutex};
use actix_files::Files;
use actix_files::NamedFile;
use actix_web::middleware::Logger;
use actix_web::{HttpServer, web, App, HttpRequest, Result as ActixResult};
use actix_session::{CookieSession};

fn index(_req: HttpRequest) -> ActixResult<NamedFile> {
    Ok(NamedFile::open("./frontend/static/index.html")?)
}

fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();
    let sys = actix_rt::System::new("carbon-bond-runtime");

    // TODO: 建造一個資料庫連接池，以避免只有單條連線，導致性能瓶頸
    // 現有的 r2d2 對 postgres 的支援不完美
    let conn = Arc::new(Mutex::new(db::connect_db()));

    HttpServer::new(move || {
        let log_format = "
                        '%r' %s
                        Referer: %{Referer}i
                        User-Agent: %{User-Agent}i
                        IP: %a
                        處理時間: %T 秒";

        App::new()
            .data(conn.clone())
            .wrap(Logger::new(log_format))
            .wrap(CookieSession::signed(&[0; 32]).secure(false))
            .route("/api", web::post().to(api::api))
            .route("/graphiql", web::get().to(api::graphiql))
            .route("/app", web::get().to(index))
            .route("/", web::get().to(index))
            .default_service(Files::new("", "./frontend/static"))
    })
    .bind("127.0.0.1:8080")?
    .start();

    sys.run()
}
