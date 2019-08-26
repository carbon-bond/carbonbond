use actix::prelude::*;

#[derive(actix::Message)]
pub struct Message {
    // TODO: 時間、誰
    pub content: String,
}

#[derive(actix::Message)]
pub struct Connect {
    pub id: i64,
    pub address: Recipient<Message>,
}

#[derive(actix::Message)]
pub struct Incoming {
    // TODO: 時間、誰
    pub id: i64,
    pub content: String,
}
