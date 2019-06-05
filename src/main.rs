extern crate actix_web;
extern crate actix_files;
extern crate actix_rt;
extern crate env_logger;
mod api;

use actix_files::Files;
use actix_files::NamedFile;
use actix_web::middleware::Logger;
use actix_web::{HttpServer, web, App, HttpRequest, Result as ActixResult};

fn index(_req: HttpRequest) -> ActixResult<NamedFile> {
    Ok(NamedFile::open("./frontend/static/index.html")?)
}

fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    let sys = actix_rt::System::new("carbon-bond-runtime");

    HttpServer::new(|| {
        let log_format = "
                        '%r' %s
                        Referer: %{Referer}i
                        User-Agent: %{User-Agent}i
                        IP: %a
                        處理時間: %T 秒";

        App::new()
            .wrap(Logger::new(log_format))
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
