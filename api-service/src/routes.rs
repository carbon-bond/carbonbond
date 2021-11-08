use crate::{
    api::api_impl,
    api::api_trait::RootQueryRouter,
    api::query,
    chat,
    custom_error::{Contextable, ErrorCode, Fallible},
    db, Context, Ctx,
};
use hyper::{body::Bytes, HeaderMap};
use hyper::{Body, Response, StatusCode};
use std::convert::Infallible;
use warp::Filter;

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

async fn handle_chat(
    headers: HeaderMap,
    ws: warp::ws::Ws,
    users: chat::control::Users,
) -> Result<Box<dyn warp::Reply>, Infallible> {
    let mut context = Ctx {
        headers: headers,
        resp: Response::new(String::new()),
    };
    let id = match context.get_id().await {
        Some(id) => id,
        None => {
            log::info!("拒絕未登入用戶連接聊天室");
            return Ok(Box::new(http::status::StatusCode::UNAUTHORIZED));
        }
    };
    log::info!("用戶 {} 連接聊天室", id);
    let u = ws.on_upgrade(move |websocket| chat::control::user_connected(id, websocket, users));

    Ok(Box::new(u))
}

pub fn get_routes(
) -> Fallible<impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone> {
    // 設定前端
    let avatar = warp::path!("avatar" / String).and_then(handle_avatar);
    let users = chat::control::Users::default();
    let users = warp::any().map(move || users.clone());
    let chat = warp::path!("chat")
        .and(warp::header::headers_cloned())
        .and(warp::ws())
        .and(users)
        .and_then(handle_chat);
    let api = warp::path!("api")
        .and(warp::body::bytes())
        .and(warp::header::headers_cloned())
        .and_then(handle_api);

    let gets = warp::get().and(avatar.or(chat));

    let posts = warp::post().and(api);

    let routes = gets.or(posts);
    Ok(routes)
}
