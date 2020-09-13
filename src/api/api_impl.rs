use super::{api_trait, model};
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use crate::db;
use crate::email;
use crate::redis;
use crate::util::HasBoardProps;
use crate::Context;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Default)]
pub struct RootQueryRouter {
    article_router: ArticleQueryRouter,
    board_router: BoardQueryRouter,
    user_router: UserQueryRouter,
    party_router: PartyQueryRouter,
}
#[async_trait]
impl api_trait::RootQueryRouter for RootQueryRouter {
    type ArticleQueryRouter = ArticleQueryRouter;
    type BoardQueryRouter = BoardQueryRouter;
    type UserQueryRouter = UserQueryRouter;
    type PartyQueryRouter = PartyQueryRouter;
    fn article_router(&self) -> &Self::ArticleQueryRouter {
        &self.article_router
    }
    fn party_router(&self) -> &Self::PartyQueryRouter {
        &self.party_router
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
    async fn search_article(
        &self,
        context: &mut crate::Ctx,
        author_name: String,
        board_id: i64,
        category: String,
        end_time: Option<DateTime<Utc>>,
        start_time: Option<DateTime<Utc>>,
        str_content: HashMap<String, String>,
        title: String,
    ) -> Result<Vec<super::model::ArticleMeta>, crate::custom_error::Error> {
        Ok(vec![])
    }
    async fn query_article_list(
        &self,
        context: &mut crate::Ctx,
        author_name: Option<String>,
        board_name: Option<String>,
        count: usize,
    ) -> Fallible<Vec<model::Article>> {
        // TODO: 支援 author_name
        match board_name {
            Some(name) => Ok(db::article::get_by_board_name(&name, 0, count).await?),
            _ => Err(crate::custom_error::ErrorCode::UnImplemented.into()),
        }
    }
    async fn query_article(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
    ) -> Result<model::Article, crate::custom_error::Error> {
        let article = db::article::get_by_id(id).await?;
        Ok(article)
    }
    async fn query_bonder(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
    ) -> Result<Vec<super::model::ArticleMeta>, crate::custom_error::Error> {
        db::article::get_bonder(id).await
    }
    async fn query_article_meta(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
    ) -> Result<super::model::ArticleMeta, crate::custom_error::Error> {
        db::article::get_meta_by_id(id).await
    }
    async fn create_article(
        &self,
        context: &mut crate::Ctx,
        board_id: i64,
        category_name: String,
        title: String,
        content: String,
    ) -> Result<i64, crate::custom_error::Error> {
        println!(
            "發表文章： 看板 {}, 分類 {}, 內容 {}",
            board_id, category_name, content
        );
        let author_id = context.get_id_strict()?;
        let id = db::article::create(author_id, board_id, category_name, title, content).await?;
        Ok(id)
    }
}

#[derive(Default)]
pub struct PartyQueryRouter {}
#[async_trait]
impl api_trait::PartyQueryRouter for PartyQueryRouter {
    async fn query_party(
        &self,
        _context: &mut crate::Ctx,
        party_name: String,
    ) -> Fallible<model::Party> {
        db::party::get_by_name(&party_name).await
    }
    async fn create_party(
        &self,
        context: &mut crate::Ctx,
        board_name: Option<String>,
        party_name: String,
    ) -> Fallible<()> {
        let id = context.get_id_strict()?;
        log::debug!("{} 嘗試創建 {}", id, party_name);
        db::party::create(&party_name, board_name, id).await?;
        Ok(())
    }
}

#[derive(Default)]
pub struct BoardQueryRouter {}
#[async_trait]
impl api_trait::BoardQueryRouter for BoardQueryRouter {
    async fn query_board_list(
        &self,
        _context: &mut crate::Ctx,
        count: usize,
    ) -> Fallible<Vec<model::Board>> {
        db::board::get_all().await?.assign_props().await
    }
    async fn query_board_name_list(
        &self,
        _context: &mut crate::Ctx,
    ) -> Fallible<Vec<model::BoardName>> {
        db::board::get_all_board_names().await
    }
    async fn query_board(&self, context: &mut crate::Ctx, name: String) -> Fallible<model::Board> {
        let board = db::board::get_by_name(&name).await?;
        if let Some(user_id) = context.get_id() {
            redis::board_pop::set_board_pop(user_id, board.id).await?;
        }
        board.assign_props().await
    }
    async fn query_board_by_id(&self, context: &mut crate::Ctx, id: i64) -> Fallible<model::Board> {
        let board = db::board::get_by_id(id).await?;
        if let Some(user_id) = context.get_id() {
            redis::board_pop::set_board_pop(user_id, board.id).await?;
        }
        board.assign_props().await
    }
    async fn create_board(
        &self,
        context: &mut crate::Ctx,
        new_board: model::NewBoard,
    ) -> Fallible<i64> {
        Ok(db::board::create(&new_board).await?)
    }
    async fn query_subscribed_user_count(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
    ) -> Result<usize, crate::custom_error::Error> {
        db::subscribed_boards::get_subscribed_user_count(id).await
    }
    async fn query_hot_boards(
        &self,
        _context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::BoardOverview>, crate::custom_error::Error> {
        let board_ids = redis::hot_boards::get_hot_boards().await?;
        db::board::get_overview(&board_ids)
            .await?
            .assign_props()
            .await
    }
}

#[derive(Default)]
pub struct UserQueryRouter {}
#[async_trait]
impl api_trait::UserQueryRouter for UserQueryRouter {
    async fn send_signup_email(
        &self,
        _context: &mut crate::Ctx,
        email: String,
    ) -> Result<(), crate::custom_error::Error> {
        let token = db::user::create_signup_token(&email).await?;
        if db::user::email_used(&email).await? {
            Err(ErrorCode::DuplicateRegister.into())
        } else {
            email::send_signup_email(&token, &email)
        }
    }
    async fn signup(
        &self,
        context: &mut crate::Ctx,
        password: String,
        token: String,
        user_name: String,
    ) -> Result<super::model::User, crate::custom_error::Error> {
        db::user::signup_with_token(&user_name, &password, &token).await?;
        self.login(context, password, user_name.clone())
            .await?
            .ok_or(Error::new_internal(format!(
                "創完帳號 {} 就無法登入？",
                user_name
            )))
    }
    async fn query_email_by_token(
        &self,
        _context: &mut crate::Ctx,
        token: String,
    ) -> Result<String, crate::custom_error::Error> {
        if let Some(email) = db::user::get_email_by_token(&token).await? {
            Ok(email)
        } else {
            Err(ErrorCode::NotFound(DataType::SignupToken, token).into())
        }
    }

    async fn query_me(&self, context: &mut crate::Ctx) -> Fallible<Option<model::User>> {
        if let Some(id) = context.get_id() {
            Ok(Some(db::user::get_by_id(id).await?))
        } else {
            Ok(None)
        }
    }
    async fn query_my_party_list(&self, context: &mut crate::Ctx) -> Fallible<Vec<model::Party>> {
        let id = context.get_id_strict()?;
        db::party::get_by_member_id(id).await
    }
    async fn query_user(
        &self,
        _context: &mut crate::Ctx,
        name: String,
    ) -> Result<super::model::User, crate::custom_error::Error> {
        db::user::get_by_name(&name).await
    }
    async fn login(
        &self,
        context: &mut crate::Ctx,
        password: String,
        user_name: String,
    ) -> Fallible<Option<model::User>> {
        let user = db::user::login(&user_name, &password).await?;
        context.remember_id(user.id)?;
        Ok(Some(user))
    }
    async fn logout(&self, context: &mut crate::Ctx) -> Fallible<()> {
        context.forget_id()
    }
    async fn query_subcribed_boards(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::BoardOverview>, crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::subscribed_boards::get_subscribed_boards(id)
            .await?
            .assign_props()
            .await
    }
    async fn unsubscribe_board(
        &self,
        context: &mut crate::Ctx,
        board_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::subscribed_boards::unsubscribe(id, board_id).await
    }
    async fn subscribe_board(
        &self,
        context: &mut crate::Ctx,
        board_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::subscribed_boards::subscribe(id, board_id).await
    }
    async fn create_user_relation(
        &self,
        context: &mut crate::Ctx,
        kind: model::UserRelationKind,
        target_user: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let from_user = context.get_id_strict()?;
        db::user::create_relation(&model::UserRelation {
            from_user,
            kind,
            to_user: target_user,
        })
        .await
    }
}
