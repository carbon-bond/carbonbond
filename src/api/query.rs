use chitin::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum RootQuery {
    #[chitin(router)]
    User(UserQuery),
    #[chitin(router)]
    Article(ArticleQuery),
    #[chitin(router)]
    Board(BoardQuery),
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum UserQuery {
    #[chitin(request, response = "Option<super::model::User>")]
    QueryMe {},
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum ArticleQuery {
    #[chitin(request, response = "Vec<super::model::Article>")]
    QueryArticles { count: usize, board_name: String },
}
#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum BoardQuery {
    #[chitin(request, response = "Vec<super::model::Article>")]
    QueryBoards { count: usize },
}
