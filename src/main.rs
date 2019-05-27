extern crate actix_web;
extern crate env_logger;

use actix_web::{server, App, HttpRequest, fs};
use actix_web::middleware::Logger;

fn index(_req: &HttpRequest) -> &'static str {
    "金剛、石墨，參見！"
}

fn main() {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    server::new(|| vec![
        App::new().prefix("/yo").resource("/", |r| r.f(index))
            .middleware(Logger::default())
            .middleware(Logger::new("%a %{User-Agent}i")),
        App::new().handler(
                "/app",
                fs::StaticFiles::new("./frontend/static/")
                    .unwrap()
                    .show_files_listing()),
        ])
        .bind("127.0.0.1:8080")
        .unwrap()
        .run();
}
