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
        id: u64,
        board_name: String,
        create_time: DateTime<Utc>,
        title: String,
        detail: String,
        ruling_party_id: u64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Article {
        id: u64,
        title: String,
        energy: i32,
        create_time: DateTime<Utc>,
        root_id: u64,
        author_id: u64,
        content: Vec<String>,
        category: String, // XXX: ??
        board_id: u64,
    }
}

pub use model::*;
