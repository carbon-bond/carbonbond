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
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum UserQuery {
    #[chitin(leaf, response = "Option<super::model::User>")]
    QueryMe {},
    #[chitin(leaf, response = "Vec<super::model::Party>")]
    QueryMyPartyList {},
    #[chitin(leaf, response = "Vec<super::model::Favorite>")]
    QueryMyFavoriteArticleList {},

    #[chitin(leaf, response = "()")]
    SendSignupEmail { email: String, is_invite: bool },
    #[chitin(leaf, response = "()")]
    SendResetPasswordEmail { email: String },
    #[chitin(leaf, response = "super::model::User")]
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

    #[chitin(leaf, response = "Option<super::model::User>")]
    Login { user_name: String, password: String },
    #[chitin(leaf, response = "()")]
    Logout {},
    #[chitin(leaf, response = "super::model::User")]
    QueryUser { name: String },
    #[chitin(leaf, response = "Vec<super::model::BoardOverview>")]
    QuerySubcribedBoards {},
    #[chitin(leaf, response = "()")]
    SubscribeBoard { board_id: i64 },
    #[chitin(leaf, response = "()")]
    UnsubscribeBoard { board_id: i64 },
    #[chitin(leaf, response = "i64")]
    FavoriteArticle { article_id: i64 },
    #[chitin(leaf, response = "()")]
    UnfavoriteArticle { article_id: i64 },
    #[chitin(leaf, response = "()")]
    CreateUserRelation {
        target_user: i64,
        kind: super::model::UserRelationKind,
    },
    #[chitin(leaf, response = "()")]
    DeleteUserRelation { target_user: i64 },
    #[chitin(leaf, response = "super::model::UserRelationKind")]
    QueryUserRelation { target_user: i64 },
    #[chitin(leaf, response = "Vec<super::model::UserMini>")]
    QueryFollowerList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::UserMini>")]
    QueryHaterList { user: i64 },
    #[chitin(leaf, response = "Vec<super::model::SignupInvitationCredit>")]
    QuerySignupInvitationCreditList {},
    #[chitin(leaf, response = "Vec<super::model::SignupInvitation>")]
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
    #[chitin(leaf, response = "super::model::Party")]
    QueryParty { party_name: String },
    #[chitin(leaf, response = "i64")]
    CreateParty {
        party_name: String,
        board_name: Option<String>,
    },
    #[chitin(leaf, response = "Vec<super::model::Party>")]
    QueryBoardPartyList { board_id: i64 },
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum ArticleQuery {
    #[chitin(leaf, response = "Vec<super::model::ArticleMeta>")]
    QueryArticleList {
        count: usize,
        max_id: Option<i64>,
        author_name: Option<String>,
        board_name: Option<String>,
        family_filter: super::model::FamilyFilter,
    },
    #[chitin(leaf, response = "super::model::Article")]
    QueryArticle { id: i64 },
    #[chitin(leaf, response = "super::model::ArticleMeta")]
    QueryArticleMeta { id: i64 },
    #[chitin(leaf, response = "Vec<(super::model::Edge, super::model::Article)>")]
    QueryBonder {
        id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::FamilyFilter,
    },
    #[chitin(
        leaf,
        response = "Vec<(super::model::Edge, super::model::ArticleMeta)>"
    )]
    QueryBonderMeta {
        id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::FamilyFilter,
    },
    #[chitin(leaf, response = "i64")]
    CreateArticle {
        board_id: i64,
        category_name: String,
        title: String,
        content: String,
    },
    #[chitin(leaf, response = "i64")]
    SaveDraft {
        draft_id: Option<i64>,
        board_id: i64,
        category_name: Option<String>,
        title: String,
        content: String,
    },
    #[chitin(leaf, response = "Vec<super::model::Draft>")]
    QueryDraft {},
    #[chitin(leaf, response = "Vec<super::model::ArticleMeta>")]
    SearchArticle {
        author_name: Option<String>,
        board_name: Option<String>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        category: Option<i64>,
        title: Option<String>,
        content: HashMap<String, super::model::SearchField>,
    },
    #[chitin(leaf, response = "Vec<super::model::ArticleMeta>")]
    SearchPopArticle { count: usize },
    #[chitin(leaf, response = "super::model::Graph")]
    QueryGraph {
        article_id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::FamilyFilter,
    },
}
#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum BoardQuery {
    #[chitin(leaf, response = "Vec<super::model::Board>")]
    QueryBoardList { count: usize },
    #[chitin(leaf, response = "Vec<super::model::BoardName>")]
    QueryBoardNameList {},
    #[chitin(leaf, response = "super::model::Board")]
    QueryBoard { name: String, style: String },
    #[chitin(leaf, response = "super::model::Board")]
    QueryBoardById { id: i64 },
    #[chitin(leaf, response = "usize")]
    QuerySubscribedUserCount { id: i64 },
    #[chitin(leaf, response = "i64")]
    CreateBoard { new_board: super::model::NewBoard },
    #[chitin(leaf, response = "Vec<super::model::BoardOverview>")]
    QueryHotBoards {},

    #[chitin(leaf, response = "String")]
    QueryCategoryById { id: i64 },
}

#[derive(Serialize, Deserialize, ChitinRouter, Debug, Clone)]
pub enum NotificationQuery {
    #[chitin(leaf, response = "Vec<super::model::Notification>")]
    QueryNotificationByUser { all: bool },
    #[chitin(leaf, response = "()")]
    ReadNotifications { ids: Vec<i64> },
}
