use chitin::*;

#[chitin_model]
pub mod chat_model_root {
    use chitin::*;
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct MessageSending {
        pub channel_id: i64,
        pub content: String,
    }

    #[chitin_model]
    pub mod client_trigger {
        use super::*;

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub enum API {
            MessageSending(MessageSending),
        }
    }

    #[chitin_model]
    pub mod server_trigger {
        use super::*;

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub enum API {
            InitInfo(InitInfo),
            MessageSending(MessageSending),
            NewChannel(Channel),
        }

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct InitInfo {
            pub channels: Vec<Channel>,
        }

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub enum Sender {
            Myself,
            Opposite,
        }

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct Message {
            pub id: i64,
            pub sender: Sender,
            pub text: String,
            pub time: DateTime<Utc>,
        }

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct Direct {
            pub channel_id: i64,
            pub opposite_id: i64,
            pub name: String,
            pub last_msg: Message,
            pub read_time: DateTime<Utc>,
        }
        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct WithAnonymousAuthor {
            pub channel_id: i64,
            pub article_name: String,
            pub last_msg: Message,
        }
        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct IAmAnonymousAuthor {
            pub channel_id: i64,
            pub article_name: String,
            pub last_msg: Message,
        }
        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub enum Channel {
            Direct(Direct),
            WithAnonymousAuthor(WithAnonymousAuthor),
            IAmAnonymousAuthor(IAmAnonymousAuthor),
        }
    }
}
