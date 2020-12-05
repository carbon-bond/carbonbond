use chitin::*;
#[chitin_model]
mod model {
    use chitin::*;
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use strum::EnumString;
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct User {
        pub id: i64,
        pub user_name: String,
        pub energy: i64,
        pub sentence: String,

        pub hated_count: i64,
        pub followed_count: i64,
        pub hating_count: i64,
        pub following_count: i64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Party {
        pub id: i64,
        pub party_name: String,
        pub board_id: Option<i64>,
        pub board_name: Option<String>,
        pub energy: i32,
        pub ruling: bool,
        pub create_time: DateTime<Utc>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Board {
        pub id: i64,
        pub board_name: String,
        pub create_time: DateTime<Utc>,
        pub title: String,
        pub detail: String,
        pub force: String,
        pub ruling_party_id: i64,
        pub popularity: i64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct BoardName {
        pub id: i64,
        pub board_name: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct NewBoard {
        pub board_name: String,
        pub title: String,
        pub detail: String,
        pub force: String,
        pub ruling_party_id: i64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct ArticleMeta {
        pub id: i64,
        pub board_id: i64,
        pub board_name: String,
        pub category_id: i64,
        pub category_name: String,
        pub category_source: String,
        pub title: String,
        pub author_id: i64,
        pub author_name: String,
        pub show_in_list: bool,
        pub category_families: Vec<String>,
        pub create_time: DateTime<chrono::Utc>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Article {
        pub meta: ArticleMeta,
        pub content: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct BoardOverview {
        pub id: i64,
        pub board_name: String,
        pub title: String,
        pub popularity: i64,
    }
    #[derive(
        Serialize, Deserialize, TypeScriptify, Clone, Copy, EnumString, strum::ToString, Debug,
    )]
    pub enum UserRelationKind {
        #[strum(serialize = "follow")]
        Follow,
        #[strum(serialize = "hate")]
        Hate,
        #[strum(serialize = "openly_hate")]
        OpenlyHate,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct UserRelation {
        pub from_user: i64,
        pub to_user: i64,
        pub kind: UserRelationKind,
    }
    #[derive(
        Serialize,
        Deserialize,
        TypeScriptify,
        Clone,
        Copy,
        EnumString,
        strum::ToString,
        Debug,
        Eq,
        PartialEq,
    )]
    pub enum NotificationKind {
        #[strum(serialize = "follow")]
        Follow,
        #[strum(serialize = "hate")]
        Hate,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Notification {
        pub id: i64,
        pub kind: NotificationKind,
        pub user_id: i64,
        pub read: bool,
        // Some(true) 表捷報，Some(false) 表惡耗，None 中性通知
        pub quality: Option<bool>,
        pub create_time: DateTime<Utc>,
        pub board_name: Option<String>,
        pub board_id: Option<i64>,
        pub user2_name: Option<String>,
        pub user2_id: Option<i64>,
        pub article_title: Option<String>,
        pub article_id: Option<i64>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub enum SearchField {
        String(String),
        Range((i64, i64)),
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Edge {
        pub id: i64,
        pub from: i64,
        pub to: i64,
        pub energy: i16,
        pub name: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug, Default)]
    pub struct Graph {
        pub nodes: Vec<ArticleMeta>,
        pub edges: Vec<Edge>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub enum FamilyFilter {
        WhiteList(Vec<String>),
        BlackList(Vec<String>),
        None,
    }

    #[chitin_model_use]
    use force::instance_defs::Bond;
}

pub use model::*;
