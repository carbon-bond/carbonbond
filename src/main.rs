extern crate actix_web;
extern crate actix_files;
#[macro_use]
extern crate log;
extern crate env_logger;
extern crate juniper;
#[macro_use]
extern crate clap;
extern crate toml;

use std::path::PathBuf;
use actix_files::{Files, NamedFile};
use actix_web::{middleware::Logger, web, HttpServer, App, HttpRequest, Result as ActixResult};
use actix_session::CookieSession;
use carbonbond::{chat, db, config, image, custom_error::Fallible};
use actix::Actor;
use juniper::http::GraphQLRequest;
use crate::actix_web::FromRequest;

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
    let config_file = arg_matches
        .value_of("config_file")
        .map(|p| PathBuf::from(p));
    config::initialize_config(&config_file);
    let conf = config::CONFIG.get();

    let address = format!("{}:{}", &conf.server.address, &conf.server.port);
    info!("伺服器位置：{}", address);
    info!("資料庫位置：{}", &conf.database.url);

    // 初始化資料庫連線池
    db::init_db(&conf.database.url);
    let sys = actix::System::new("carbon-bond-runtime");

    // 啓動聊天伺服器 actor
    let chat_server_addr = chat::server::Server::default().start();

    // HttpServer::new(move || {
    //     let log_format = "
    //                     '%r' %s
    //                     Referer: %{Referer}i
    //                     User-Agent: %{User-Agent}i
    //                     IP: %a
    //                     處理時間: %T 秒";

    //     App::new()
    //         .wrap(Logger::new(log_format))
    //         .wrap(CookieSession::signed(&[0; 32]).secure(false))
    //         .service(
    //             web::resource("/api")
    //                 .data(web::Json::<GraphQLRequest>::configure(|cfg| {
    //                     // 將一個 GraphqlRequest 的數據量上限調整至 256 KB
    //                     cfg.limit(256 * 1024)
    //                 }))
    //                 .route(web::post().to(api::api)),
    //         )
    //         .route("/avatar/{user_name}", web::get().to(image::get_avatar))
    //         .route("/graphiql", web::get().to(api::graphiql))
    //         .route("/app", web::get().to(index))
    //         .route("/app/{tail:.*}", web::get().to(index))
    //         .route("/", web::get().to(index))
    //         .service(
    //             web::scope("/ws")
    //                 .data(chat_server_addr.clone())
    //                 .route("", web::get().to(chat::ws)),
    //         )
    //         .default_service(Files::new("", "./frontend/static"))
    // })
    // .bind(&address)?
    // .start();

    sys.run().map_err(|err| err.into())
}
