use super::api_trait;
use super::model;
use crate::custom_error::Fallible;
use async_trait::async_trait;

#[derive(Default)]
pub struct RootQueryRouter {
    article_router: ArticleQueryRouter,
    board_router: BoardQueryRouter,
    user_router: UserQueryRouter,
}
#[async_trait]
impl api_trait::RootQueryRouter for RootQueryRouter {
    type ArticleQueryRouter = ArticleQueryRouter;
    type BoardQueryRouter = BoardQueryRouter;
    type UserQueryRouter = UserQueryRouter;
    fn article_router(&self) -> &Self::ArticleQueryRouter {
        &self.article_router
    }
    fn board_router(&self) -> &Self::BoardQueryRouter {
        &self.board_router
    }
    fn user_router(&self) -> &Self::UserQueryRouter {
        &self.user_router
    }
}

#[derive(Default)]
pub struct ArticleQueryRouter {}
#[async_trait]
impl api_trait::ArticleQueryRouter for ArticleQueryRouter {
    async fn query_article_list(
        &self,
        context: &crate::Ctx,
        board_name: String,
        count: usize,
    ) -> Fallible<Vec<model::Article>> {
        Ok(vec![])
    }
}

#[derive(Default)]
pub struct BoardQueryRouter {}
#[async_trait]
impl api_trait::BoardQueryRouter for BoardQueryRouter {
    async fn query_board_list(
        &self,
        context: &crate::Ctx,
        count: usize,
    ) -> Fallible<Vec<model::Board>> {
        Ok(vec![])
    }
    async fn query_board(&self, context: &crate::Ctx, name: String) -> Fallible<model::Board> {
        unimplemented!()
    }
}

#[derive(Default)]
pub struct UserQueryRouter {}
#[async_trait]
impl api_trait::UserQueryRouter for UserQueryRouter {
    async fn query_me(&self, context: &crate::Ctx) -> Fallible<Option<model::User>> {
        unimplemented!()
    }
}
