use super::{api_trait, model};
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use crate::db;
use crate::email;
use crate::service;
use crate::util::{HasArticleStats, HasBoardProps};
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
    notification_router: NotificationQueryRouter,
}
#[async_trait]
impl api_trait::RootQueryRouter for RootQueryRouter {
    type ArticleQueryRouter = ArticleQueryRouter;
    type BoardQueryRouter = BoardQueryRouter;
    type UserQueryRouter = UserQueryRouter;
    type PartyQueryRouter = PartyQueryRouter;
    type NotificationQueryRouter = NotificationQueryRouter;
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
    fn notification_router(&self) -> &Self::NotificationQueryRouter {
        &self.notification_router
    }
}

fn opt_slice<T>(opt: &Option<Vec<T>>) -> Option<&[T]> {
    opt.as_ref().map(|v| v.as_ref())
}
#[derive(Default)]
pub struct ArticleQueryRouter {}
#[async_trait]
impl api_trait::ArticleQueryRouter for ArticleQueryRouter {
    async fn search_article(
        &self,
        _context: &mut crate::Ctx,
        author_name: Option<String>,
        board_name: Option<String>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        category: Option<i64>,
        title: Option<String>,
        content: HashMap<String, super::model::SearchField>,
    ) -> Result<Vec<model::ArticleMeta>, crate::custom_error::Error> {
        let meta = db::article::search_article(
            author_name,
            board_name,
            category,
            content,
            end_time,
            start_time,
            title,
        )
        .await?;
        meta.assign_stats().await
    }
    async fn query_article_list(
        &self,
        _context: &mut crate::Ctx,
        count: usize,
        max_id: Option<i64>,
        _author_name: Option<String>,
        board_name: Option<String>,
        family_filter: super::model::FamilyFilter,
    ) -> Fallible<Vec<model::ArticleMeta>> {
        // TODO: 支援 author_name
        let articles: Vec<_> = match board_name {
            Some(name) => db::article::get_by_board_name(&name, max_id, count, &family_filter)
                .await?
                .collect(),
            _ => return Err(crate::custom_error::ErrorCode::UnImplemented.into()),
        };
        articles.assign_stats().await
    }
    async fn query_article(&self, _context: &mut crate::Ctx, id: i64) -> Fallible<model::Article> {
        let article = db::article::get_by_id(id).await?;
        article.assign_stats().await
    }
    async fn query_bonder(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::FamilyFilter,
    ) -> Result<Vec<(super::model::Edge, super::model::Article)>, crate::custom_error::Error> {
        let bonders: Vec<_> = db::article::get_bonder(id, opt_slice(&category_set), &family_filter)
            .await?
            .collect();
        bonders.assign_stats().await
    }
    async fn query_bonder_meta(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::FamilyFilter,
    ) -> Result<Vec<(super::model::Edge, super::model::ArticleMeta)>, crate::custom_error::Error>
    {
        let bonders: Vec<_> =
            db::article::get_bonder_meta(id, opt_slice(&category_set), &family_filter)
                .await?
                .collect();
        bonders.assign_stats().await
    }
    async fn query_article_meta(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
    ) -> Result<super::model::ArticleMeta, crate::custom_error::Error> {
        db::article::get_meta_by_id(id).await?.assign_stats().await
    }
    async fn create_article(
        &self,
        context: &mut crate::Ctx,
        board_id: i64,
        category_name: String,
        title: String,
        content: String,
    ) -> Result<i64, crate::custom_error::Error> {
        log::trace!(
            "發表文章： 看板 {}, 分類 {}, 標題 {}, 內容 {}",
            board_id,
            category_name,
            title,
            content
        );
        let author_id = context.get_id_strict()?;
        let id = db::article::create(author_id, board_id, &category_name, &title, content.clone())
            .await?;
        service::notification::handle_article(author_id, board_id, id, &category_name, content)
            .await?;
        Ok(id)
    }
    async fn query_graph(
        &self,
        _context: &mut crate::Ctx,
        article_id: i64,
        category_set: Option<Vec<String>>,
        family_filter: super::model::FamilyFilter,
    ) -> Result<super::model::Graph, crate::custom_error::Error> {
        service::graph_view::query_graph(10, article_id, opt_slice(&category_set), &family_filter)
            .await?
            .assign_stats()
            .await
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
        party_name: String,
        board_name: Option<String>,
    ) -> Fallible<i64> {
        let id = context.get_id_strict()?;
        log::debug!("{} 嘗試創建 {}", id, party_name);
        let id = db::party::create(&party_name, board_name, id).await?;
        Ok(id)
    }
}

#[derive(Default)]
pub struct BoardQueryRouter {}
#[async_trait]
impl api_trait::BoardQueryRouter for BoardQueryRouter {
    async fn query_board_list(
        &self,
        _context: &mut crate::Ctx,
        _count: usize,
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
            service::hot_boards::set_board_pop(user_id, board.id).await?;
        }
        board.assign_props().await
    }
    async fn query_board_by_id(&self, context: &mut crate::Ctx, id: i64) -> Fallible<model::Board> {
        let board = db::board::get_by_id(id).await?;
        if let Some(user_id) = context.get_id() {
            service::hot_boards::set_board_pop(user_id, board.id).await?;
        }
        board.assign_props().await
    }
    async fn create_board(
        &self,
        _context: &mut crate::Ctx,
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
        let board_ids = service::hot_boards::get_hot_boards().await?;
        db::board::get_overview(&board_ids)
            .await?
            .assign_props()
            .await
    }
    async fn query_category_by_id(
        &self,
        _context: &mut crate::Ctx,
        id: i64,
    ) -> Result<String, crate::custom_error::Error> {
        let source = db::board::get_category_by_id(id).await?;
        Ok(source)
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
        user_name: String,
        password: String,
        token: String,
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
    async fn query_my_favorite_article_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Fallible<Vec<model::Favorite>> {
        let id = context.get_id_strict()?;
        let articles: Vec<_> = db::favorite::get_by_user_id(id).await?.collect();
        articles.assign_stats().await
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
        user_name: String,
        password: String,
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
    async fn favorite_article(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
    ) -> Result<i64, crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        let favorite_id = db::favorite::favorite(id, article_id).await?;
        Ok(favorite_id)
    }
    async fn unfavorite_article(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::favorite::unfavorite(id, article_id).await
    }
    async fn create_user_relation(
        &self,
        context: &mut crate::Ctx,
        target_user: i64,
        kind: model::UserRelationKind,
    ) -> Result<(), crate::custom_error::Error> {
        let from_user = context.get_id_strict()?;
        db::user::create_relation(&model::UserRelation {
            from_user,
            kind,
            to_user: target_user,
        })
        .await?;

        use model::NotificationKind;
        let noti = |kind| {
            service::notification::create(target_user, kind, Some(from_user), None, None, None)
        };
        match kind {
            model::UserRelationKind::Follow => {
                noti(NotificationKind::Follow).await?;
            }
            model::UserRelationKind::OpenlyHate => {
                noti(NotificationKind::Hate).await?;
            }
            _ => (),
        }
        Ok(())
    }
    async fn update_avatar(
        &self,
        context: &mut crate::Ctx,
        image: String,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::avatar::update_avatar(id, image).await
    }
    async fn update_sentence(
        &self,
        context: &mut crate::Ctx,
        sentence: String,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::user::update_sentence(id, sentence).await
    }
    async fn update_information(
        &self,
        context: &mut crate::Ctx,
        introduction: String,
        gender: String,
        job: String,
        city: String,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict()?;
        db::user::update_info(id, introduction, gender, job, city).await
    }
}

#[derive(Default)]
pub struct NotificationQueryRouter {}
#[async_trait]
impl api_trait::NotificationQueryRouter for NotificationQueryRouter {
    async fn query_notification_by_user(
        &self,
        context: &mut crate::Ctx,
        all: bool,
    ) -> Result<Vec<super::model::Notification>, crate::custom_error::Error> {
        let user_id = context.get_id_strict()?;
        let notificartions = db::notification::get_by_user(user_id, all).await?;
        Ok(notificartions)
    }
    async fn read_notifications(
        &self,
        context: &mut crate::Ctx,
        ids: Vec<i64>,
    ) -> Result<(), crate::custom_error::Error> {
        let user_id = context.get_id_strict()?;
        db::notification::read(&ids, user_id).await
    }
}
