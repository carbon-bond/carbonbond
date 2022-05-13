use carbonbond::{
    config, custom_error::Fallible, db, redis, routes::get_routes, service::hot_articles,
    service::hot_boards,
};
use structopt::StructOpt;

mod bin_util;

#[derive(StructOpt, Debug)]
struct ArgRoot {
    #[structopt(short, long = "config-file")]
    config_file: Option<String>,
}

#[tokio::main]
async fn main() -> Fallible<()> {
    // 初始化紀錄器
    env_logger::init();

    // 解析命令行參數
    let args = ArgRoot::from_args();

    // 載入設定
    config::init(args.config_file);
    let conf = config::get_config();

    log::info!("資料庫遷移");
    bin_util::migrate().await.unwrap();

    // 初始化資料庫
    log::info!("初始化資料庫連線池，位置：{}", &conf.database.get_url());
    db::init().await.unwrap();

    // 初始化 redis
    log::info!("初始化 redis 客戶端");
    redis::init().await.unwrap();

    // 初始化熱門文章統計資料
    log::info!("初始化熱門文章統計資料");
    hot_articles::init().await.unwrap();

    // 初始化熱門看板統計資料
    log::info!("初始化熱門看板統計資料");
    hot_boards::init().await.unwrap();

    // 啓動伺服器
    let addr: std::net::SocketAddr =
        format!("{}:{}", &conf.server.address, &conf.server.port).parse()?;
    log::info!("靜候於 http://{}", addr);

    let routes = get_routes()?;
    let web_service = warp::serve(routes).run(addr);

    tokio::select! {
        _ = web_service => {},
    };

    Ok(())
}
