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
use hyper::service::{make_service_fn, service_fn};
use hyper::{header, Body, Method, Request, Response, Server, StatusCode};
use hyper_staticfile::Static;
use state::Storage;

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

async fn on_request(
    req: Request<Body>,
    static_files: Static,
) -> Result<Response<Body>, hyper::Error> {
    let resp = on_request_inner(req, static_files).await;
    match resp {
        Ok(body) => Ok(body),
        Err(err) => {
            let err_msg = serde_json::to_string(&err).unwrap_or(String::default());
            let mut err_body = Response::new(Body::from(err_msg));
            *err_body.status_mut() = StatusCode::BAD_REQUEST;
            Ok(err_body)
        }
    }
}

async fn on_request_inner(req: Request<Body>, static_files: Static) -> Fallible<Response<Body>> {
    match (req.method(), req.uri().path()) {
        (&Method::POST, "/api") => {
            let (parts, body) = req.into_parts();
            log::trace!("原始請求： {:#?}", body);

            let mut context = Ctx {
                headers: parts.headers,
                resp: Response::new(String::new()),
            };
            let body = hyper::body::to_bytes(body).await?;

            let query: query::RootQuery = serde_json::from_slice(&body.to_vec()).map_err(|e| {
                ErrorCode::ParsingJson.context(format!("解析請求 {:?} 錯誤 {}", body, e,))
            })?;
            let resp = on_api(query, &mut context).await?;
            context.resp.body_mut().push_str(&resp);
            Ok(context.resp.map(|s| Body::from(s)))
        }
        (&Method::GET, _) => {
            let url = req.uri().path();
            if url == "/" || url.starts_with("/app") {
                // html 檔案
                let (parts, _) = req.into_parts();
                if let Some(user_agent) = parts.headers.get(header::USER_AGENT) {
                    let user_agent = user_agent.to_str()?;
                    if carbonbond::util::is_mobile(&user_agent) {
                        return Ok(Response::new(Body::from(index_mobile())));
                    }
                }
                Ok(Response::new(Body::from(index())))
            } else if url.starts_with("/avatar") {
                // 大頭貼
                let dirs = req.uri().path().split("/").collect::<Vec<&str>>();
                if dirs.len() == 3 {
                    let user_name = dirs[2];
                    match percent_encoding::percent_decode(user_name.as_bytes()).decode_utf8() {
                        Ok(user_name) => {
                            log::trace!("請求大頭貼： {}", user_name);
                            Ok(Response::new(Body::from(
                                db::avatar::get_avatar(&user_name).await?,
                            )))
                        }
                        Err(_) => Ok(not_found()),
                    }
                } else {
                    Ok(not_found())
                }
            } else {
                log::trace!("靜態資源： {}", req.uri().path());
                static_files.clone().serve(req).await.map_err(|e| e.into())
            }
        }
        _ => Ok(not_found()),
    }
}
async fn on_api(query: query::RootQuery, context: &mut Ctx) -> Fallible<String> {
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
    let static_files = Static::new(prj_path.join("./frontend/static"));

    log::info!("載入首頁");
    let content = std::fs::read_to_string(prj_path.join("./frontend/static/index.html"))
        .expect("讀取首頁失敗");
    INDEX.set(content);
    let content = std::fs::read_to_string(prj_path.join("./frontend/static/m.index.html"))
        .expect("讀取行動版首頁失敗");
    INDEX_MOBILE.set(content);

    // 啓動伺服器
    log::info!("啟動伺服器");
    let addr: std::net::SocketAddr =
        format!("{}:{}", &conf.server.address, &conf.server.port).parse()?;
    let service = make_service_fn(|_| {
        let static_files = static_files.clone();
        async {
            Ok::<_, hyper::Error>(service_fn(move |req| on_request(req, static_files.clone())))
        }
    });
    let server = Server::bind(&addr).serve(service);

    log::info!("Listening on http://{}", addr);
    tokio::select! {
        res = server => {
            res?;
        },
        res = hot_boards::start() => {
            res?;
        }
    };

    Ok(())
}
