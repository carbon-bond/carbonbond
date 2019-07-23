extern crate actix_web;
extern crate actix_files;
extern crate actix_rt;
#[macro_use]
extern crate log;
extern crate env_logger;
extern crate juniper;
#[macro_use]
extern crate clap;
extern crate toml;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use actix_files::Files;
use actix_files::NamedFile;
use actix_web::middleware::Logger;
use actix_web::{HttpServer, web, App, HttpRequest, Result as ActixResult};
use actix_session::{CookieSession};

use carbonbond::{api, db, config, custom_error::Fallible};

fn index(_req: HttpRequest) -> ActixResult<NamedFile> {
    Ok(NamedFile::open("./frontend/static/index.html")?)
}

fn main() -> Fallible<()> {
    // 初始化紀錄器
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    // 載入設定
    let args_config = load_yaml!("args.yaml");
    let arg_matches = clap::App::from_yaml(args_config).get_matches();
    let config_file = match arg_matches.value_of("config_file") {
        Some(path) => PathBuf::from(path),
        None => PathBuf::from("config/carbonbond.toml"),
    };
    config::initialize_config(config_file);
    let conf = config::CONFIG.get();

    let address = format!("{}:{}", &conf.server.address, &conf.server.port);
    info!("伺服器位置：{}", address);
    info!("資料庫位置：{}", &conf.database.url);

    let sys = actix_rt::System::new("carbon-bond-runtime");

    // TODO: 建造一個資料庫連接池，以避免只有單條連線，導致性能瓶頸
    // 現有的 r2d2 對 postgres 的支援不完美
    let conn = Arc::new(Mutex::new(db::connect_db(&conf.database.url)));

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
            .route("/app/{tail:.*}", web::get().to(index))
            .route("/", web::get().to(index))
            .default_service(Files::new("", "./frontend/static"))
    })
    .bind(&address)?
    .start();

    sys.run().map_err(|err| err.into())
}
