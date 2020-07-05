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

use chrono::offset::TimeZone;
use chrono::offset::Utc;

use crate::db;
use crate::db::{models, schema};
use crate::custom_error;
use crate::custom_error::Fallible;
use crate::user;

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

trait ChatError {
    fn to_chat_error(&self) -> chat_proto::Error;
}

impl ChatError for custom_error::Error {
    fn to_chat_error(&self) -> chat_proto::Error {
        match self {
            custom_error::Error::LogicError { code, msg } => chat_proto::Error {
                reason: format!("{} {}", code.to_string(), msg),
            },
            _ => chat_proto::Error {
                reason: "內部錯誤".to_owned(),
            },
        }
    }
}

trait ToProtoMessage {
    fn to_proto_message(&self) -> Fallible<chat_proto::Message>;
}

impl ToProtoMessage for models::DirectMessage {
    fn to_proto_message(&self) -> Fallible<chat_proto::Message> {
        let conn = db::connect_db()?;
        let sender = user::find_user_by_id(&conn, self.sender_id)?;
        Ok(chat_proto::Message {
            id: self.id,
            sender_id: self.sender_id,
            sender_name: sender.name,
            content: self.content.clone(),
            time: self.create_time.timestamp_millis(),
        })
    }
}

pub fn get_recent_chat(
    id: i64,
    request: &chat_proto::RecentChat,
) -> chat_proto::RecentChatResponse {
    use schema::{direct_chats, direct_messages};
    use chat_proto::recent_chat_response::Response;

    let get_data = || -> Fallible<Response> {
        let conn = db::connect_db()?;

        let chats = direct_chats::table
            .filter(direct_chats::user_id_1.eq(id))
            .or_filter(direct_chats::user_id_2.eq(id))
            .inner_join(
                direct_messages::table.on(direct_chats::id.eq(direct_messages::direct_chat_id)),
            )
            .filter(direct_messages::create_time.lt(Utc.timestamp_millis(request.before_time)))
            .order((direct_chats::id, direct_messages::create_time.desc()))
            .distinct_on(direct_chats::id)
            .limit(request.number)
            .load::<(models::DirectChat, models::DirectMessage)>(&conn)?;

        use chat_proto::recent_chat_response::{ChatAbstract, ChatAbstracts};
        use chat_proto::recent_chat_response::chat_abstract::{DirectChat, Info};

        // println!("{:?}", chats);
        let mut chat_abstracts = Vec::new();
        for chat in chats.iter() {
            let (direct_chat, direct_message) = chat;

            let otherone = if direct_chat.user_id_1 == id {
                user::find_user_by_id(&conn, direct_chat.user_id_2)?
            } else {
                user::find_user_by_id(&conn, direct_chat.user_id_1)?
            };

            chat_abstracts.push(ChatAbstract {
                info: Some(Info::DirectChat(DirectChat {
                    direct_chat_id: direct_chat.id,
                    name: otherone.name,
                    latest_message: Some(direct_message.to_proto_message()?),
                    read_time: 0, // TODO: 在資料庫新增一個用來記錄讀取時間的表
                })),
            })
        }

        Ok(Response::Chats(ChatAbstracts {
            chats: chat_abstracts,
        }))
    };

    let data = get_data().unwrap_or_else(|err| {
        println!("{:?}", err);
        Response::Error(err.to_chat_error())
    });

    chat_proto::RecentChatResponse {
        response: Some(data),
    }
}

pub fn ws(
    req: HttpRequest,
    stream: web::Payload,
    session: Session,
    server_address: web::Data<actix::Addr<Server>>,
) -> Result<HttpResponse, actix_web::Error> {
    match session.get::<i64>("id") {
        Err(_) => Ok(HttpResponse::Unauthorized().finish()),
        Ok(None) => Ok(HttpResponse::Unauthorized().finish()),
        Ok(Some(id)) => {
            let resp = ws::start(
                ChatSession {
                    id: id,
                    server_address: server_address.get_ref().clone(),
                },
                &req,
                stream,
            );
            println!("chat websocket connected: {}", id);
            resp
        }
    }
}
