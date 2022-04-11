use chitin::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum RootQuery {
    #[chitin(router)]
    Chat(ChatQuery),
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
// TODO: 考慮移至 websocket ，將聊天室切割成一個服務
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum ChatQuery {
    #[chitin(leaf, response = "i64")]
    CreateChatIfNotExist { opposite_id: i64, msg: String },
    #[chitin(
        leaf,
        response = "Vec<super::model::chat::chat_model_root::server_trigger::Message>"
    )]
    QueryDirectChatHistory {
        chat_id: i64,
        last_msg_id: i64,
        number: i64,
    },
    #[chitin(leaf, response = "()")]
    UpdateReadTime { chat_id: i64 },
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum UserQuery {
    #[chitin(leaf, response = "Option<super::model::forum::User>")]
    QueryMe {},
    #[chitin(leaf, response = "Vec<super::model::forum::Party>")]
    QueryMyPartyList {},
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMetaWithBonds>")]
    QueryMyFavoriteArticleList {},

    // 法務部律師查詢系統 https://lawyerbc.moj.gov.tw/
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

    // 人際關係
    #[chitin(leaf, response = "()")]
    DeleteUserRelation { target_user: i64 },
    #[chitin(leaf, response = "super::model::forum::UserRelation")]
    QueryUserRelation { target_user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryPublicFollowerList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryPublicHaterList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryPublicFollowingList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryPublicHatingList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryMyPrivateFollowingList {},
    #[chitin(leaf, response = "Vec<super::model::forum::UserMini>")]
    QueryMyPrivateHatingList {},

    // 註冊邀請
    #[chitin(leaf, response = "Vec<super::model::forum::SignupInvitationCredit>")]
    QuerySignupInvitationCreditList {},
    #[chitin(leaf, response = "Vec<super::model::forum::SignupInvitation>")]
    QuerySignupInvitationList {},

    // 個人資料
    #[chitin(leaf, response = "()")]
    UpdateAvatar { image: String },
    #[chitin(leaf, response = "()")]
    UpdateSentence { sentence: String },
    #[chitin(leaf, response = "()")]
    UpdateInformation {
        introduction: String,
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
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMetaWithBonds>")]
    QueryArticleList {
        count: usize,
        max_id: Option<i64>,
        author_name: Option<String>,
        board_name: Option<String>,
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
    },
    #[chitin(
        leaf,
        response = "Vec<(super::model::forum::Edge, super::model::forum::ArticleMeta)>"
    )]
    QueryBonderMeta {
        id: i64,
        category_set: Option<Vec<String>>,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::Comment>")]
    QueryCommentList { article_id: i64 },
    #[chitin(leaf, response = "i64")]
    CreateComment {
        article_id: i64,
        content: String,
        anonymous: bool,
    },
    #[chitin(leaf, response = "i64")]
    CreateArticle {
        new_article: super::model::forum::NewArticle,
    },
    #[chitin(leaf, response = "i64")]
    SaveDraft {
        draft_id: Option<i64>,
        board_id: i64,
        category_name: Option<String>,
        title: String,
        content: String,
        bonds: String,
        anonymous: bool,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::Draft>")]
    QueryDraft {},
    #[chitin(leaf, response = "()")]
    DeleteDraft { draft_id: i64 },
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMetaWithBonds>")]
    SearchArticle {
        author_name: Option<String>,
        board_name: Option<String>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        category: Option<String>,
        title: Option<String>,
        content: HashMap<String, super::model::forum::SearchField>,
    },
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMetaWithBonds>")]
    SearchPopArticle { count: usize },
    #[chitin(leaf, response = "Vec<super::model::forum::ArticleMetaWithBonds>")]
    GetSubscribeArticle { count: usize },
    #[chitin(leaf, response = "super::model::forum::Graph")]
    QueryGraph {
        article_id: i64,
        category_set: Option<Vec<String>>,
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
