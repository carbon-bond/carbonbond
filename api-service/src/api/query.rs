use chitin::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum RootQuery {
    #[chitin(router)]
    User(UserQuery),
    #[chitin(router)]
    Party(PartyQuery),
    #[chitin(router)]
    Article(ArticleQuery),
    #[chitin(router)]
    Board(BoardQuery),
    #[chitin(router)]
    Notification(NotificationQuery),
    #[chitin(router)]
    Config(ConfigQuery),
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum UserQuery {
    #[chitin(leaf, response = "Option<super::model::forum::User>")]
    QueryMe {},
    #[chitin(leaf, response = "Vec<super::model::forum::Party>")]
    QueryMyPartyList {},
    #[chitin(leaf, response = "Vec<super::model::forum::Favorite>")]
    QueryMyFavoriteArticleList {},

    #[chitin(leaf, response = "Vec<super::model::forum::LawyerbcResultMini>")]
    QuerySearchResultFromLawyerbc { search_text: String },
    #[chitin(leaf, response = "super::model::forum::LawyerbcResult")]
    QueryDetailResultFromLawyerbc { license_id: String },
    #[chitin(leaf, response = "()")]
    RecordSignupApply {
        email: String,
        birth_year: i32,
        gender: String,
        license_id: String,
        is_invite: bool,
    },
    #[chitin(leaf, response = "()")]
    SendSignupEmail { email: String, is_invite: bool },
    #[chitin(leaf, response = "()")]
    SendResetPasswordEmail { email: String },
    #[chitin(leaf, response = "super::model::forum::User")]
    Signup {
        user_name: String,
        password: String,
        token: String,
    },
    #[chitin(leaf, response = "String")]
    QueryEmailByToken { token: String },

    #[chitin(leaf, response = "Option<String>")]
    QueryUserNameByResetPasswordToken { token: String },
    #[chitin(leaf, response = "()")]
    ResetPasswordByToken { password: String, token: String },

    #[chitin(leaf, response = "Option<super::model::forum::User>")]
    Login { user_name: String, password: String },
    #[chitin(leaf, response = "()")]
    Logout {},
    #[chitin(leaf, response = "super::model::forum::User")]
    QueryUser { name: String },
    #[chitin(leaf, response = "Vec<super::model::forum::BoardOverview>")]
    QuerySubcribedBoards {},
    #[chitin(leaf, response = "()")]
    SubscribeBoard { board_id: i64 },
    #[chitin(leaf, response = "()")]
    UnsubscribeBoard { board_id: i64 },
    #[chitin(leaf, response = "i64")]
    FavoriteArticle { article_id: i64 },
    #[chitin(leaf, response = "()")]
    UnfavoriteArticle { article_id: i64 },
    #[chitin(leaf, response = "i64")]
    TrackingArticle { article_id: i64 },
    #[chitin(leaf, response = "()")]
    UntrackingArticle { article_id: i64 },
    #[chitin(leaf, response = "()")]
    CreateUserRelation {
        target_user: i64,
        kind: super::model::forum::UserRelationKind,
        is_public: bool,
    },
    #[chitin(leaf, response = "()")]
    DeleteUserRelation { target_user: i64 },
    #[chitin(leaf, response = "super::model::forum::UserRelation")]
    QueryUserRelation { target_user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryFollowerList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryHaterList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryFollowingList { user: i64, is_public: bool },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryHatingList { user: i64, is_public: bool },
    #[chitin(leaf, response = "Vec<super::model::forum::SignupInvitationCredit>")]
    QuerySignupInvitationCreditList {},
    #[chitin(leaf, response = "Vec<super::model::forum::SignupInvitation>")]
    QuerySignupInvitationList {},
    #[chitin(leaf, response = "()")]
    UpdateAvatar { image: String },
    #[chitin(leaf, response = "()")]
    UpdateSentence { sentence: String },
    #[chitin(leaf, response = "()")]
    UpdateInformation {
        introduction: String,
        gender: String,
        job: String,
        city: String,
    },
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum PartyQuery {
    #[chitin(leaf, response = "super::model::forum::Party")]
    QueryParty { party_name: String },
    #[chitin(leaf, response = "i64")]
    CreateParty {
        party_name: String,
        board_name: Option<String>,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::Party>")]
    QueryBoardPartyList { board_id: i64 },
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum ArticleQuery {
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMeta>")]
    QueryArticleList {
        count: usize,
        max_id: Option<i64>,
        author_name: Option<String>,
        board_name: Option<String>,
        family_filter: super::model::forum::FamilyFilter,
    },
    #[chitin(leaf, response = "super::model::forum::Article")]
    QueryArticle { id: i64 },
    #[chitin(leaf, response = "super::model::forum::ArticleMeta")]
    QueryArticleMeta { id: i64 },
    #[chitin(
        leaf,
        response = "Vec<(super::model::forum::Edge, super::model::forum::Article)>"
    )]
    QueryBonder {
        id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::forum::FamilyFilter,
    },
    #[chitin(
        leaf,
        response = "Vec<(super::model::forum::Edge, super::model::forum::ArticleMeta)>"
    )]
    QueryBonderMeta {
        id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::forum::FamilyFilter,
    },
    #[chitin(leaf, response = "i64")]
    CreateArticle {
        board_id: i64,
        category_name: String,
        title: String,
        content: String,
        draft_id: Option<i64>,
        anonymous: bool,
    },
    #[chitin(leaf, response = "i64")]
    SaveDraft {
        draft_id: Option<i64>,
        board_id: i64,
        category_name: Option<String>,
        title: String,
        content: String,
        anonymous: bool,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::Draft>")]
    QueryDraft {},
    #[chitin(leaf, response = "()")]
    DeleteDraft { draft_id: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMeta>")]
    SearchArticle {
        author_name: Option<String>,
        board_name: Option<String>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        category: Option<i64>,
        title: Option<String>,
        content: HashMap<String, super::model::forum::SearchField>,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMeta>")]
    SearchPopArticle { count: usize },
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMeta>")]
    GetSubscribeArticle { count: usize },
    #[chitin(leaf, response = "super::model::forum::Graph")]
    QueryGraph {
        article_id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::forum::FamilyFilter,
    },
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum BoardQuery {
    #[chitin(leaf, response = "Vec<super::model::forum::Board>")]
    QueryBoardList { count: usize },
    #[chitin(leaf, response = "Vec<super::model::forum::BoardName>")]
    QueryBoardNameList {},
    #[chitin(leaf, response = "super::model::forum::Board")]
    QueryBoard { name: String, style: String },
    #[chitin(leaf, response = "super::model::forum::Board")]
    QueryBoardById { id: i64 },
    #[chitin(leaf, response = "usize")]
    QuerySubscribedUserCount { id: i64 },
    #[chitin(leaf, response = "i64")]
    CreateBoard {
        new_board: super::model::forum::NewBoard,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::BoardOverview>")]
    QueryHotBoards {},

    #[chitin(leaf, response = "String")]
    QueryCategoryById { id: i64 },
}

#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum NotificationQuery {
    #[chitin(leaf, response = "Vec<super::model::forum::Notification>")]
    QueryNotificationByUser { all: bool },
    #[chitin(leaf, response = "()")]
    ReadNotifications { ids: Vec<i64> },
}

#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum ConfigQuery {
    #[chitin(leaf, response = "super::model::forum::Config")]
    QueryConfig {},
}
