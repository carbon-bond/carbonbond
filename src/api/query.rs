use chitin::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, ChitinCodegen, Debug)]
pub enum RootQuery {
    #[chitin(request, response = "Vec<crate::model::Article>")]
    AskArticles { count: usize },
    // #[chitin(router)]
    // User(UserQuery), // 注意：假如這裡打錯成 `User(i32)` 或其它不是 `ChitinCodegen` 的東西，會報出很難解的錯誤
}
