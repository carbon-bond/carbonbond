use chitin::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
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
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum UserQuery {
    #[chitin(request, response = "Option<super::model::User>")]
    QueryMe {},
    #[chitin(request, response = "Vec<super::model::Party>")]
    QueryMyPartyList {},
    #[chitin(request, response = "Option<super::model::User>")]
    Login { user_name: String, password: String },
    #[chitin(request, response = "()")]
    Logout {},
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum PartyQuery {
    #[chitin(request, response = "super::model::Party")]
    QueryParty { id: i64 },
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum ArticleQuery {
    #[chitin(request, response = "Vec<super::model::Article>")]
    QueryArticleList {
        count: usize,
        board_name: Option<String>,
        author_name: Option<String>,
    },
    #[chitin(request, response = "super::model::Article")]
    QueryArticle { id: i64 },
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum BoardQuery {
    #[chitin(request, response = "Vec<super::model::Board>")]
    QueryBoardList { count: usize },
    #[chitin(request, response = "super::model::Board")]
    QueryBoard { name: String },
}
