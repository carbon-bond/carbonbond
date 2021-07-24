use carbonbond::{
    config, custom_error::Fallible, db, redis, routes::get_routes, service::hot_boards, Ctx,
};

#[tokio::main]
async fn main() -> Fallible<()> {
    // 初始化紀錄器
    env_logger::init();

    // 解析命令行參數
    let args_config = clap::load_yaml!("args.yaml");
    let arg_matches = clap::App::from_yaml(args_config).get_matches();

    // 載入設定
    let config_file = arg_matches.value_of("config_file").map(|s| s.to_string());
    config::init(config_file);
    let conf = config::get_config();

    // 初始化資料庫
    log::info!("初始化資料庫連線池，位置：{}", &conf.database.get_url());
    db::init().await.unwrap();

    // 初始化 redis
    log::info!("初始化 redis 客戶端");
    redis::init().await.unwrap();

    // 啓動伺服器
    let addr: std::net::SocketAddr =
        format!("{}:{}", &conf.server.address, &conf.server.port).parse()?;
    log::info!("靜候於 http://{}", addr);

    let routes = get_routes()?;
    let web_service = warp::serve(routes).run(addr);

    tokio::select! {
        _ = web_service => {},
        res = hot_boards::start() => { res?; },
    };

    Ok(())
}
