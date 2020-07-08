use chitin::*;
#[chitin_model]
mod model {
    use chitin::chitin_util;
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct User {
        pub user_name: String,
        pub energy: i32,
        pub sentence: String,
        pub invitation_credit: u64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Board {
        pub id: u64,
        pub board_name: String,
        pub create_time: DateTime<Utc>,
        pub title: String,
        pub detail: String,
        pub ruling_party_id: u64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Article {
        pub id: u64,
        pub category: String, // XXX: ??
        pub title: String,
        pub energy: i32,
        pub create_time: DateTime<Utc>,
        pub root_id: u64,
        pub author_id: u64,
        pub author_name: String,
        pub content: Vec<String>,
        pub board_id: u64,
        pub board_name: String,
    }
}

pub use model::*;
