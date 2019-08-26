mod chat_proto;
mod chat_session;
pub mod server;
mod api;

use actix_session::{Session};
use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use chat_session::ChatSession;
use server::Server;

// use prost::Message;

pub fn ws(
    req: HttpRequest,
    stream: web::Payload,
    session: Session,
    server_address: web::Data<actix::Addr<Server>>,
) -> Result<HttpResponse, Error> {
    match session.get::<i64>("id") {
        Err(_) => Ok(HttpResponse::Unauthorized().finish()),
        Ok(id) => {
            let resp = ws::start(
                ChatSession {
                    id: id.unwrap(),
                    server_address: server_address.get_ref().clone(),
                },
                &req,
                stream,
            );
            println!("{:?}", resp);
            resp
        }
    }
}
