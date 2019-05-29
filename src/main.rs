extern crate actix_web;
extern crate env_logger;

use actix_web::middleware::Logger;
use actix_web::{fs, server, App, HttpRequest, Result as ActixResult};
use fs::NamedFile;

fn index(_req: &HttpRequest) -> ActixResult<NamedFile> {
    Ok(NamedFile::open("./frontend/static/index.html")?)
}

fn main() {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    server::new(|| {
        vec![
            // App::new().prefix("/yo").resource("/", |r| r.f(index))
            //     .middleware(Logger::default())
            //     .middleware(Logger::new("%a %{User-Agent}i")),
            App::new()
                .resource("/app/{tail:.*}", |r| r.f(index))
                .resource("/app", |r| r.f(index))
                .resource("/", |r| r.f(index))
                .handler(
                    "/",
                    fs::StaticFiles::new("./frontend/static")
                        .unwrap()
                        .show_files_listing(),
                )
                .middleware(Logger::default())
                .middleware(Logger::new("%a %{User-Agent}i")),
        ]
    })
    .bind("127.0.0.1:8080")
    .unwrap()
    .run();
}
