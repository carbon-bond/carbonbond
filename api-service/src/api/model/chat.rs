use chitin::*;

#[chitin_model]
pub mod chat_model_root {
    use chitin::*;
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct MessageSending {
        pub chat_id: i64,
        pub content: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub enum NewChat {
        AnonymousArticle(i64), // 文章 id
        User(i64),             // 用戶 id
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
            NewChat(Chat),
        }

        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct InitInfo {
            pub chats: Vec<Chat>,
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
            pub chat_id: i64,
            pub opposite_id: i64,
            pub name: String,
            pub last_msg: Message,
            pub read_time: DateTime<Utc>,
        }
        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub struct AnonymousArticle {
            pub chat_id: i64,
            pub article_id: i64,
            pub article_title: String,
            pub last_msg: Message,
            pub read_time: DateTime<Utc>,
        }
        #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
        pub enum Chat {
            Direct(Direct),
            AnonymousArticle(AnonymousArticle),
        }
    }
}
