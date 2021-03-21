use carbonbond::{
    api::api_impl,
    api::api_trait::RootQueryRouter,
    api::query,
    config,
    custom_error::{Contextable, ErrorCode, Fallible},
    db, redis,
    service::hot_boards,
    Ctx,
};
use hyper::{body::Bytes, HeaderMap};
use hyper::{Body, Response, StatusCode};
use state::Storage;
use std::convert::Infallible;
use warp::Filter;

static INDEX: Storage<String> = Storage::new();
static INDEX_MOBILE: Storage<String> = Storage::new();
fn index() -> &'static str {
    INDEX.get()
}
fn index_mobile() -> &'static str {
    INDEX_MOBILE.get()
}

fn not_found() -> Response<Body> {
    let mut not_found = Response::default();
    *not_found.status_mut() = StatusCode::NOT_FOUND;
    not_found
}

fn to_response(resp: Fallible<Response<Body>>) -> Response<Body> {
    match resp {
        Ok(body) => body,
        Err(err) => {
            let err_msg = serde_json::to_string(&err).unwrap_or(String::default());
            let mut err_body = Response::new(Body::from(err_msg));
            *err_body.status_mut() = StatusCode::BAD_REQUEST;
            err_body
        }
    }
}

async fn _handle_avatar(user_name: String) -> Fallible<Response<Body>> {
    match percent_encoding::percent_decode(user_name.as_bytes()).decode_utf8() {
        Ok(user_name) => {
            log::trace!("請求大頭貼： {}", user_name);
            Ok(Response::new(Body::from(
                db::avatar::get_avatar(&user_name).await?,
            )))
        }
        Err(_) => Ok(not_found()),
    }
}

async fn handle_avatar(user_name: String) -> Result<impl warp::Reply, Infallible> {
    Ok(to_response(_handle_avatar(user_name).await))
}

async fn run_chitin(query: query::RootQuery, context: &mut Ctx) -> Fallible<String> {
    log::info!("請求： {:?}", query);
    let root: api_impl::RootQueryRouter = Default::default();
    let resp = root
        .handle(context, query.clone())
        .await
        .context("api 物件序列化錯誤（極異常！）")?;

    if let Some(err) = &resp.1 {
        log::warn!("執行 api {:?} 時發生錯誤： {}", query, err);
    }
    Ok(resp.0)
}

async fn _handle_api(body: Bytes, headers: HeaderMap) -> Fallible<Response<Body>> {
    let mut context = Ctx {
        headers: headers,
        resp: Response::new(String::new()),
    };

    let query: query::RootQuery = serde_json::from_slice(&body.to_vec())
        .map_err(|e| ErrorCode::ParsingJson.context(format!("解析請求 {:?} 錯誤 {}", body, e,)))?;

    let resp = run_chitin(query, &mut context).await?;

    context.resp.body_mut().push_str(&resp);
    Ok(context.resp.map(|s| Body::from(s)))
}

async fn handle_api(body: Bytes, headers: HeaderMap) -> Result<impl warp::Reply, Infallible> {
    Ok(to_response(_handle_api(body, headers).await))
}

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

    // 設定前端
    log::info!("載入前端資源");
    let prj_path = config::prj_path()?;

    // TODO: 改爲檔案串流
    log::info!("載入首頁");
    let content = std::fs::read_to_string(prj_path.join("./frontend/static/index.html"))
        .expect("讀取首頁失敗");
    INDEX.set(content);
    let content = std::fs::read_to_string(prj_path.join("./frontend/static/m.index.html"))
        .expect("讀取行動版首頁失敗");
    INDEX_MOBILE.set(content);

    // 啓動伺服器
    let home = warp::path::end()
        .or(warp::path("app"))
        .and(warp::header("user-agent"))
        .map(|_, user_agent: String| {
            if carbonbond::util::is_mobile(&user_agent) {
                Response::new(Body::from(index_mobile()))
            } else {
                Response::new(Body::from(index()))
            }
        });
    let static_resource = warp::fs::dir(prj_path.join("./frontend/static"));
    let avatar = warp::path!("avatar" / String).and_then(handle_avatar);
    let api = warp::post()
        .and(warp::path!("api"))
        .and(warp::body::bytes())
        .and(warp::header::headers_cloned())
        .and_then(handle_api);
    let routes = warp::get().and(home.or(static_resource).or(avatar));

    let addr: std::net::SocketAddr =
        format!("{}:{}", &conf.server.address, &conf.server.port).parse()?;
    log::info!("靜候於 http://{}", addr);

    let web_service = warp::serve(routes.or(api)).run(addr);

    tokio::select! {
        _ = web_service => {},
        res = hot_boards::start() => { res?; },
    };

    Ok(())
}
