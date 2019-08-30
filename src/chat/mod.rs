mod chat_proto;
mod chat_session;
pub mod server;
mod api;

use actix_session::{Session};
use actix_web::{web, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use chat_session::ChatSession;
use server::Server;

use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::{Error, Fallible};

/// 回傳剛創的直接對話 id
pub fn create_direct_chat(conn: &PgConnection, user_id_1: i64, user_id_2: i64) -> Fallible<i64> {
    let new_direct_chat = models::NewDirectChat {
        user_id_1,
        user_id_2,
    };
    let direct_chat: models::DirectChat = diesel::insert_into(schema::direct_chats::table)
        .values(&new_direct_chat)
        .get_result(conn)?;

    Ok(direct_chat.id)
}

pub fn create_direct_message(
    conn: &PgConnection,
    direct_chat_id: i64,
    sender_id: i64,
    content: String,
) -> Fallible<i64> {
    let new_direct_message = models::NewDirectMessage {
        direct_chat_id,
        sender_id,
        content,
    };
    let direct_message: models::DirectMessage = diesel::insert_into(schema::direct_messages::table)
        .values(&new_direct_message)
        .get_result(conn)?;

    Ok(direct_message.id)
}

// use prost::Message;

pub fn ws(
    req: HttpRequest,
    stream: web::Payload,
    session: Session,
    server_address: web::Data<actix::Addr<Server>>,
) -> Result<HttpResponse, actix_web::Error> {
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
