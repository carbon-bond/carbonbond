use chitin::*;
#[chitin_model]
pub mod forum_model_root {
    use chitin::*;
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use strum::EnumString;
    use typescript_definitions::{TypeScriptify, TypeScriptifyTrait};

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct User {
        pub id: i64,
        pub user_name: String,
        pub email: String,
        pub energy: i64,
        pub sentence: String,

        pub hater_count_public: i64,
        pub hater_count_private: i64,
        pub follower_count_public: i64,
        pub follower_count_private: i64,
        pub hating_count_public: i64,
        pub hating_count_private: i64,
        pub following_count_public: i64,
        pub following_count_private: i64,
        pub introduction: String,
        pub gender: String,
        pub birth_year: i32,
        pub job: String,
        pub city: String,
        pub titles: Option<String>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct UserMini {
        pub id: i64,
        pub user_name: String,
        pub energy: i64,
        pub sentence: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct LawyerbcResultMini {
        pub name: String,
        pub now_lic_no: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct LawyerbcResult {
        pub name: String,
        pub sex: String,
        pub id_no: String,
        pub now_lic_no: String,
        pub birthsday: i64,
        pub email: String,
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
    #[derive(
        Serialize, Deserialize, TypeScriptify, Clone, Copy, EnumString, strum::ToString, Debug,
    )]
    pub enum BoardType {
        #[strum(serialize = "General")]
        General,
        #[strum(serialize = "Personal")]
        Personal,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Board {
        pub id: i64,
        pub board_name: String,
        pub board_type: BoardType,
        pub create_time: DateTime<Utc>,
        pub title: String,
        pub detail: String,
        #[ts(ts_type = "force.Force")]
        pub force: force::Force,
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
        pub board_type: BoardType,
        pub title: String,
        pub detail: String,
        #[ts(ts_type = "force.Force")]
        pub force: force::Force,
        pub ruling_party_id: i64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug, Default)]
    pub struct ArticlePersonalMeta {
        pub is_favorite: bool,
        pub is_tracking: bool,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct ArticleDigest {
        pub content: String,
        pub truncated: bool,
    }

    macro_rules! make_meta {
        ($name: ident $(, $element: ident, $ty: ty)*) => {
            #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
            pub struct $name {
                pub id: i64,
                pub energy: i32,
                pub board_id: i64,
                pub board_name: String,
                pub board_type: String,
                pub category: String,
                pub title: String,
                pub author_id: i64,
                pub author_name: String,
                pub digest_content: String,
                pub digest_truncated: bool,
                pub create_time: DateTime<chrono::Utc>,
                pub anonymous: bool,
                pub fields: String,
                $(pub $element: $ty),*
            }
        }
    }

    make_meta!(PrimitiveArticleMeta);
    make_meta!(
        FavoriteArticleMeta,
        favorite_create_time,
        DateTime<chrono::Utc>
    );
    make_meta!(
        BondArticleMeta,
        from_id,
        i64,
        to_id,
        i64,
        bond_energy,
        i16,
        bond_id,
        i64,
        bond_tag,
        Option<String>
    );

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub enum Author {
        NamedAuthor { id: i64, name: String },
        MyAnonymous, // 匿名文章的作者就是我
        Anonymous,
    }

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct NewArticle {
        pub board_id: i64,
        pub category_name: String,
        pub title: String,
        pub content: String,
        #[ts(ts_type = "force.Bond[]")]
        pub bonds: Vec<force::Bond>,
        pub draft_id: Option<i64>,
        pub anonymous: bool,
    }

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct ArticleMeta {
        pub id: i64,
        pub energy: i32,
        pub board_id: i64,
        pub board_name: String,
        pub board_type: BoardType,
        pub category: String,
        pub title: String,
        pub author: Author,
        pub digest: ArticleDigest,
        pub create_time: DateTime<chrono::Utc>,
        #[ts(ts_type = "force.Field[]")]
        pub fields: Vec<force::Field>,

        pub stat: ArticleStatistics,
        pub personal_meta: ArticlePersonalMeta,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct SignupInvitationCredit {
        pub id: i64,
        pub event_name: String,
        pub credit: i32,
        pub create_time: DateTime<chrono::Utc>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct SignupInvitation {
        pub email: String,
        pub user_name: Option<String>,
        pub create_time: DateTime<chrono::Utc>,
        pub is_used: bool,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug, Default)]
    pub struct ArticleStatistics {
        pub replies: i64,
        pub comments: i64,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct BondInfo {
        pub article_meta: MiniArticleMeta,
        pub energy: i64,
        pub tag: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct MiniArticleMeta {
        pub category: String,
        pub board_name: String,
        pub board_type: BoardType,
        pub author: Author,
        pub id: i64,
        pub title: String,
        pub create_time: DateTime<chrono::Utc>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct ArticleMetaWithBonds {
        pub meta: ArticleMeta,
        pub bonds: Vec<BondInfo>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Article {
        pub meta: ArticleMeta,
        pub bonds: Vec<BondInfo>,
        pub content: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Comment {
        pub id: i64,
        pub author: Author,
        pub create_time: DateTime<chrono::Utc>,
        pub content: String,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Draft {
        pub id: i64,
        pub author_id: i64,
        pub board_id: i64,
        pub board_name: String,
        pub category: Option<String>,
        pub title: String,
        pub content: String,
        pub bonds: String,
        pub create_time: DateTime<chrono::Utc>,
        pub edit_time: DateTime<chrono::Utc>,
        pub anonymous: bool,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct BoardOverview {
        pub id: i64,
        pub board_name: String,
        pub board_type: BoardType,
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
        #[strum(serialize = "none")]
        None,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct UserRelation {
        pub from_user: i64,
        pub to_user: i64,
        pub kind: UserRelationKind,
        pub is_public: bool,
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
        #[strum(serialize = "article_replied")]
        ArticleReplied,
        #[strum(serialize = "article_good_replied")]
        ArticleGoodReplied,
        #[strum(serialize = "article_bad_replied")]
        ArticleBadReplied,
        #[strum(serialize = "comment_replied")]
        CommentReplied,
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
        pub board_type: Option<BoardType>,
        pub board_id: Option<i64>,
        pub user2_name: Option<String>,
        pub user2_id: Option<i64>,
        pub article1_title: Option<String>,
        pub article2_title: Option<String>,
        pub article1_id: Option<i64>,
        pub article2_id: Option<i64>,
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
        pub tag: Option<String>,
    }
    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug, Default)]
    pub struct Graph {
        pub nodes: Vec<ArticleMeta>,
        pub edges: Vec<Edge>,
    }

    #[derive(Serialize, Deserialize, TypeScriptify, Clone, Debug)]
    pub struct Config {
        pub min_password_length: usize,
        pub max_password_length: usize,
    }

    #[chitin_model]
    pub mod force {
        use super::*;
        #[chitin_model_use]
        pub use crate::force::{Bond, Category, Field, FieldKind, Force};
    }
}

pub use forum_model_root::*;
