use actix::{Actor, StreamHandler, Handler};
use actix::prelude::*;
use super::api;
use super::server::Server;
use super::chat_proto;
use actix_web_actors::ws;
use prost::Message;
use bytes::IntoBuf;

pub struct ChatSession {
    pub id: i64,
    pub server_address: actix::Addr<Server>,
}

impl Actor for ChatSession {
    type Context = ws::WebsocketContext<Self>;
    fn started(&mut self, ctx: &mut Self::Context) {
        self.server_address
            .send(api::Connect {
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

impl Handler<api::Message> for ChatSession {
    type Result = ();
    fn handle(&mut self, _msg: api::Message, ctx: &mut Self::Context) {
        unimplemented!();
    }
}

impl StreamHandler<ws::Message, ws::ProtocolError> for ChatSession {
    fn handle(&mut self, msg: ws::Message, ctx: &mut Self::Context) {
        match msg {
            ws::Message::Ping(msg) => ctx.pong(&msg),
            ws::Message::Text(text) => {
                self.server_address.do_send(api::Incoming {
                    id: self.id,
                    content: text.clone(),
                });
                ctx.text(text)
            }
            ws::Message::Binary(bin) => {
                // TODO: 避免直接 unwrap
                let mut buf = bin.into_buf();

                let raw_data =
                    chat_proto::ClientSendData::decode_length_delimited(&mut buf).unwrap();

                use chat_proto::client_send_data::Data;

                if let Some(data) = raw_data.data {
                    match data {
                        Data::RecentChat(recent_chat) => {
                            let response = super::get_recent_chat(self.id, &recent_chat);
                            let response = chat_proto::ServerSendData {
                                id: raw_data.id,
                                data: Some(chat_proto::server_send_data::Data::RecentChatResponse(
                                    response,
                                )),
                            };
                            let mut buf: Vec<u8> = Vec::new();
                            match response.encode(&mut buf) {
                                Err(_) => {
                                    // TODO: log 錯誤訊息
                                    ctx.stop();
                                }
                                Ok(()) => {
                                    ctx.binary(buf);
                                }
                            }
                        }
                        _ => {
                            println!("未知指令");
                        }
                    }
                }
            }
            _ => (),
        }
    }
}
