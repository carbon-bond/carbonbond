extern crate actix_web;
extern crate env_logger;

use actix_web::{server, App, fs};
use actix_web::middleware::Logger;

fn main() {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    server::new(|| vec![
        // App::new().prefix("/yo").resource("/", |r| r.f(index))
        //     .middleware(Logger::default())
        //     .middleware(Logger::new("%a %{User-Agent}i")),
        App::new().handler(
                "/",
                fs::StaticFiles::new("./frontend/dist/")
                    .unwrap()
                    .show_files_listing())
                    .middleware(Logger::default())
                    .middleware(Logger::new("%a %{User-Agent}i")),
        ])
        .bind("127.0.0.1:8080")
        .unwrap()
        .run();
}
