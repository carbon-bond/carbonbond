mod chat_proto;

use actix_session::{Session};
use actix::prelude::*;
use actix::{Actor, StreamHandler, Recipient, Handler};
use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use std::collections::HashMap;

// use prost::Message;

#[derive(actix::Message)]
pub struct Message {
    // TODO: 時間、誰
    content: String,
}

pub struct Server {
    sessions: HashMap<i64, Recipient<Message>>,
}

impl Actor for Server {
    type Context = actix::Context<Self>;
}

impl Default for Server {
    fn default() -> Server {
        Server {
            sessions: HashMap::new(),
        }
    }
}

#[derive(actix::Message)]
pub struct Connect {
    pub id: i64,
    pub address: Recipient<Message>,
}

impl Handler<Connect> for Server {
    type Result = ();

    fn handle(&mut self, msg: Connect, _: &mut Self::Context) -> Self::Result {
        self.sessions.insert(msg.id, msg.address);
    }
}

#[derive(actix::Message)]
pub struct Incoming {
    // TODO: 時間、誰
    id: i64,
    content: String,
}

impl Handler<Incoming> for Server {
    type Result = ();

    fn handle(&mut self, msg: Incoming, _: &mut Self::Context) -> Self::Result {
        for (id, address) in self.sessions.iter() {
            if *id == msg.id {
                continue;
            }
            address.do_send(Message {
                content: format!("{}: {}", msg.id, msg.content),
            });
        }
    }
}

struct ChatSession {
    id: i64,
    server_address: actix::Addr<Server>,
}

impl Actor for ChatSession {
    type Context = ws::WebsocketContext<Self>;
    fn started(&mut self, ctx: &mut Self::Context) {
        self.server_address
            .send(Connect {
                id: self.id,
                address: ctx.address().recipient(),
            })
            .into_actor(self)
            .then(|res, _actor, ctx| {
                match res {
                    Ok(_) => {}
                    _ => ctx.stop(),
                }
                actix::fut::ok(())
            })
            .wait(ctx);
    }
}

impl Handler<Message> for ChatSession {
    type Result = ();
    fn handle(&mut self, msg: Message, ctx: &mut Self::Context) {
        ctx.text(msg.content);
    }
}

impl StreamHandler<ws::Message, ws::ProtocolError> for ChatSession {
    fn handle(&mut self, msg: ws::Message, ctx: &mut Self::Context) {
        match msg {
            ws::Message::Ping(msg) => ctx.pong(&msg),
            ws::Message::Text(text) => {
                self.server_address.do_send(Incoming {
                    id: self.id,
                    content: text.clone(),
                });
                ctx.text(text)
            }
            ws::Message::Binary(bin) => {
                // TODO: 避免直接 unwrap
                // let client_send_meta = chat_proto::ClientSendMeta::decode(&bin).unwrap();
                // println!("{}", client_send_meta.id);
                // ctx.binary(bin)
            }
            _ => (),
        }
    }
}

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
