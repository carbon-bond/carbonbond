use chitin::*;
use serde::{Deserialize, Serialize};

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
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug, Clone)]
pub enum PartyQuery {
    #[chitin(request, response = "super::model::Party")]
    QueryParty { party_name: String },
    #[chitin(request, response = "()")]
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
    #[chitin(request, response = "()")]
    CreateArticle {
        board_id: i64,
        category_name: String,
        title: String,
        content: String,
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
}
