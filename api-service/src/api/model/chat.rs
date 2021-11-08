use chitin::*;

#[chitin_model]
mod model {
    use chitin::*;
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use strum::EnumString;
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Message {
        pub text: String,
        pub time: DateTime<Utc>,
    }

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Direct {
        pub channel_id: i64,
        pub name: String,
        pub last_msg: Message,
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

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct InitInfo {
        pub channels: Vec<Channel>,
    }

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct MessageSending {
        pub channel_id: i64,
        pub content: String,
    }
}

pub use model::*;
