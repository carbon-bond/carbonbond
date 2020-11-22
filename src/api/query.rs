use chitin::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
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
#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
pub enum UserQuery {
    #[chitin(request, response = "Option<super::model::User>")]
    QueryMe {},
    #[chitin(request, response = "Vec<super::model::Party>")]
    QueryMyPartyList {},

    #[chitin(request, response = "()")]
    SendSignupEmail { email: String },
    #[chitin(request, response = "super::model::User")]
    Signup {
        user_name: String,
        password: String,
        token: String,
    },
    #[chitin(request, response = "String")]
    QueryEmailByToken { token: String },

    #[chitin(request, response = "Option<super::model::User>")]
    Login { user_name: String, password: String },
    #[chitin(request, response = "()")]
    Logout {},
    #[chitin(request, response = "super::model::User")]
    QueryUser { name: String },
    #[chitin(request, response = "Vec<super::model::BoardOverview>")]
    QuerySubcribedBoards {},
    #[chitin(request, response = "()")]
    SubscribeBoard { board_id: i64 },
    #[chitin(request, response = "()")]
    UnsubscribeBoard { board_id: i64 },
    #[chitin(request, response = "()")]
    CreateUserRelation {
        target_user: i64,
        kind: super::model::UserRelationKind,
    },
    #[chitin(request, response = "()")]
    UpdateAvatar { image: String },
    #[chitin(request, response = "()")]
    UpdateSentence { sentence: String },
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
pub enum PartyQuery {
    #[chitin(request, response = "super::model::Party")]
    QueryParty { party_name: String },
    #[chitin(request, response = "i64")]
    CreateParty {
        party_name: String,
        board_name: Option<String>,
    },
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
pub enum ArticleQuery {
    #[chitin(request, response = "Vec<super::model::Article>")]
    QueryArticleList {
        count: usize,
        author_name: Option<String>,
        board_name: Option<String>,
    },
    #[chitin(request, response = "super::model::Article")]
    QueryArticle { id: i64 },
    #[chitin(request, response = "super::model::ArticleMeta")]
    QueryArticleMeta { id: i64 },
    #[chitin(request, response = "Vec<super::model::Article>")]
    QueryBonder { id: i64, category_set: Vec<String> },
    #[chitin(request, response = "Vec<super::model::ArticleMeta>")]
    QueryBonderMeta { id: i64, category_set: Vec<String> },
    #[chitin(request, response = "i64")]
    CreateArticle {
        board_id: i64,
        category_name: String,
        title: String,
        content: String,
    },
    #[chitin(request, response = "Vec<super::model::Article>")]
    SearchArticle {
        author_name: Option<String>,
        board_name: Option<String>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        category: Option<i64>,
        title: Option<String>,
        content: HashMap<String, super::model::SearchField>,
    },
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
pub enum BoardQuery {
    #[chitin(request, response = "Vec<super::model::Board>")]
    QueryBoardList { count: usize },
    #[chitin(request, response = "Vec<super::model::BoardName>")]
    QueryBoardNameList {},
    #[chitin(request, response = "super::model::Board")]
    QueryBoard { name: String },
    #[chitin(request, response = "super::model::Board")]
    QueryBoardById { id: i64 },
    #[chitin(request, response = "usize")]
    QuerySubscribedUserCount { id: i64 },
    #[chitin(request, response = "i64")]
    CreateBoard { new_board: super::model::NewBoard },
    #[chitin(request, response = "Vec<super::model::BoardOverview>")]
    QueryHotBoards {},

    #[chitin(request, response = "String")]
    QueryCategoryById { id: i64 },
}

#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
pub enum NotificationQuery {
    #[chitin(request, response = "Vec<super::model::Notification>")]
    QueryNotificationByUser { all: bool },
    #[chitin(request, response = "()")]
    ReadNotifications { ids: Vec<i64> },
}
