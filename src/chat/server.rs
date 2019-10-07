use std::collections::HashMap;
use actix::prelude::*;
use super::api;

pub struct Server {
    sessions: HashMap<i64, Recipient<api::Message>>,
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

impl Handler<api::Connect> for Server {
    type Result = ();

    fn handle(&mut self, msg: api::Connect, _: &mut Self::Context) -> Self::Result {
        self.sessions.insert(msg.id, msg.address);
    }
}

impl Handler<api::Incoming> for Server {
    type Result = ();

    fn handle(&mut self, _msg: api::Incoming, _: &mut Self::Context) -> Self::Result {
        unimplemented!();
        // for (id, address) in self.sessions.iter() {
        //     if *id == msg.id {
        //         continue;
        //     }
        //     address.do_send(api::Message {
        //         content: format!("{}: {}", msg.id, msg.content),
        //     });
        // }
    }
}
