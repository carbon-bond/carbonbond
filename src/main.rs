extern crate actix_web;
extern crate env_logger;
mod graphql;

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
        let log_format = "
                        '%r' %s
                        Referer: %{Referer}i
                        User-Agent: %{User-Agent}i
                        IP: %a
                        處理時間: %T 秒";

        vec![
            App::new()
                .prefix("/api")
                .resource("/", |r| r.f(graphql::api))
                .resource("", |r| r.f(graphql::api))
                .middleware(Logger::new(log_format)),
            App::new()
                .prefix("/graphiql")
                .resource("/", |r| r.f(graphql::graphiql))
                .resource("", |r| r.f(graphql::graphiql))
                .middleware(Logger::new(log_format)),
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
                .middleware(Logger::new(log_format)),
        ]
    })
    .bind("127.0.0.1:8080")
    .unwrap()
    .run();
}
