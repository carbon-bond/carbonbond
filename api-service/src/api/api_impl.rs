use super::model::forum::NewArticle;
use super::{api_trait, model};
use crate::api::model::chat::chat_model_root::server_trigger;
use crate::chat;
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use crate::db;
use crate::service;
use crate::util::{HasArticleStats, HasBoardProps};
use crate::{Context, Ctx};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

async fn complete_article<A: HasArticleStats>(mut articles: A, ctx: &mut Ctx) -> Fallible<A> {
    articles.assign_stats_in_place().await?;
    if let Some(user_id) = ctx.get_id().await {
        articles.assign_personal_meta_in_place(user_id).await?;
    }
    Ok(articles)
}

#[derive(Default)]
pub struct RootQueryRouter {
    chat_router: ChatQueryRouter,
    article_router: ArticleQueryRouter,
    board_router: BoardQueryRouter,
    user_router: UserQueryRouter,
    party_router: PartyQueryRouter,
    notification_router: NotificationQueryRouter,
    config_router: ConfigQueryRouter,
}
#[async_trait]
impl api_trait::RootQueryRouter for RootQueryRouter {
    type ChatQueryRouter = ChatQueryRouter;
    type ArticleQueryRouter = ArticleQueryRouter;
    type BoardQueryRouter = BoardQueryRouter;
    type UserQueryRouter = UserQueryRouter;
    type PartyQueryRouter = PartyQueryRouter;
    type NotificationQueryRouter = NotificationQueryRouter;
    type ConfigQueryRouter = ConfigQueryRouter;
    fn chat_router(&self) -> &Self::ChatQueryRouter {
        &self.chat_router
    }
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
    fn config_router(&self) -> &Self::ConfigQueryRouter {
        &self.config_router
    }
}

fn opt_slice<T>(opt: &Option<Vec<T>>) -> Option<&[T]> {
    opt.as_ref().map(|v| v.as_ref())
}
#[derive(Default)]
pub struct ChatQueryRouter {}
#[async_trait]
impl api_trait::ChatQueryRouter for ChatQueryRouter {
    async fn create_chat_if_not_exist(
        &self,
        context: &mut crate::Ctx,
        opposite_id: i64,
        msg: String,
    ) -> Result<i64, crate::custom_error::Error> {
        let user_id = context.get_id_strict().await?;
        let chat_id = chat::channel::create_if_not_exist(user_id, opposite_id, msg).await?;
        let channel = chat::channel::get_direct_chat_by_id(chat_id, opposite_id).await?;
        context
            .users
            .send_api(opposite_id, server_trigger::API::NewChannel(channel))
            .await;
        Ok(chat_id)
    }
    async fn query_direct_chat_history(
        &self,
        context: &mut crate::Ctx,
        chat_id: i64,
        last_msg_id: i64,
        number: i64,
    ) -> Result<
        Vec<super::model::chat::chat_model_root::server_trigger::Message>,
        crate::custom_error::Error,
    > {
        let user_id = context.get_id_strict().await?;
        chat::message::get_direct_chat_history(user_id, chat_id, last_msg_id, number).await
    }
    async fn update_read_time(
        &self,
        context: &mut crate::Ctx,
        chat_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let user_id = context.get_id_strict().await?;
        chat::channel::update_direct_chat_read_time(chat_id, user_id, Utc::now()).await
    }
}
#[derive(Default)]
pub struct ArticleQueryRouter {}
#[async_trait]
impl api_trait::ArticleQueryRouter for ArticleQueryRouter {
    async fn search_article(
        &self,
        context: &mut crate::Ctx,
        author_name: Option<String>,
        board_name: Option<String>,
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        category: Option<String>,
        title: Option<String>,
        content: HashMap<String, super::model::forum::SearchField>,
    ) -> Result<Vec<model::forum::ArticleMetaWithBonds>, crate::custom_error::Error> {
        let viewer_id = context.get_id().await;
        let meta = db::article::search_article(
            viewer_id,
            author_name,
            board_name,
            category,
            content,
            end_time,
            start_time,
            title,
        )
        .await?;
        let articles = complete_article(meta, context).await?;
        db::article::add_bond_to_metas(articles, viewer_id).await
    }
    async fn search_pop_article(
        &self,
        context: &mut crate::Ctx,
        count: usize,
    ) -> Result<Vec<model::forum::ArticleMetaWithBonds>, crate::custom_error::Error> {
        let mut articles: Vec<model::forum::ArticleMeta> = Vec::new();
        let hot_article_ids = service::hot_articles::get_hot_articles().await?;
        let viewer_id = context.get_id().await;
        // TODO: N + 1 問題
        for hot_article_id in hot_article_ids.iter() {
            let res: i64 = (*hot_article_id).clone();
            let article = db::article::get_meta_by_id(res, viewer_id).await?;
            articles.push(article);
            if articles.len() >= count {
                break;
            }
        }
        let articles = complete_article(articles, context).await?;
        db::article::add_bond_to_metas(articles, viewer_id).await
    }
    async fn get_subscribe_article(
        &self,
        context: &mut crate::Ctx,
        count: usize,
    ) -> Result<Vec<model::forum::ArticleMetaWithBonds>, crate::custom_error::Error> {
        let user_id = context.get_id_strict().await?;

        let tracking_articles = db::tracking::query_tracking_articles(user_id, count).await?;
        let articles = db::article::get_meta_by_ids(&tracking_articles, Some(user_id)).await?;

        let articles = complete_article(articles, context).await?;
        db::article::add_bond_to_metas(articles, Some(user_id)).await
    }
    async fn query_article_list(
        &self,
        context: &mut crate::Ctx,
        count: usize,
        max_id: Option<i64>,
        _author_name: Option<String>,
        board_name: Option<String>,
    ) -> Fallible<Vec<model::forum::ArticleMetaWithBonds>> {
        let viewer_id = context.get_id().await;
        // TODO: 支援 author_name
        let articles: Vec<_> = match board_name {
            Some(name) => db::article::get_by_board_name(viewer_id, &name, max_id, count)
                .await?
                .collect(),
            _ => return Err(crate::custom_error::ErrorCode::UnImplemented.into()),
        };
        let articles = complete_article(articles, context).await?;
        db::article::add_bond_to_metas(articles, viewer_id).await
    }
    async fn query_article(
        &self,
        context: &mut crate::Ctx,
        id: i64,
    ) -> Fallible<model::forum::Article> {
        let viewer_id = context.get_id().await;
        let article = db::article::get_by_id(id, viewer_id).await?;
        complete_article(article, context).await
    }
    async fn save_draft(
        &self,
        context: &mut crate::Ctx,
        draft_id: Option<i64>,
        board_id: i64,
        category: Option<String>,
        title: String,
        content: String,
        bonds: String,
        anonymous: bool,
    ) -> Result<i64, crate::custom_error::Error> {
        let author_id = context.get_id_strict().await?;
        match draft_id {
            Some(id) => {
                db::draft::update_draft(
                    id, board_id, category, title, content, bonds, author_id, anonymous,
                )
                .await
            }
            None => {
                db::draft::create_draft(
                    board_id, category, title, content, bonds, author_id, anonymous,
                )
                .await
            }
        }
    }
    async fn query_draft(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::forum::Draft>, crate::custom_error::Error> {
        let author_id = context.get_id_strict().await?;
        db::draft::get_all(author_id).await
    }
    async fn delete_draft(
        &self,
        context: &mut crate::Ctx,
        draft_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        // TODO: 僅有草稿擁有者纔可以刪除草稿
        db::draft::delete(draft_id).await
    }
    async fn query_comment_list(
        &self,
        _context: &mut crate::Ctx,
        article_id: i64,
    ) -> Fallible<Vec<super::model::forum::Comment>> {
        db::comment::get_by_article_id(article_id).await
    }
    async fn create_comment(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
        content: String,
    ) -> Fallible<i64> {
        let author_id = context.get_id_strict().await?;
        let comment_id = db::comment::create(author_id, article_id, content).await?;
        service::notification::handle_comment(author_id, article_id).await?;
        Ok(comment_id)
    }
    async fn query_bonder(
        &self,
        context: &mut crate::Ctx,
        id: i64,
        category_set: Option<Vec<String>>,
    ) -> Result<
        Vec<(super::model::forum::Edge, super::model::forum::Article)>,
        crate::custom_error::Error,
    > {
        let viewer_id = context.get_id().await;
        let bonders: Vec<_> = db::article::get_bonder(viewer_id, id, opt_slice(&category_set))
            .await?
            .collect();
        complete_article(bonders, context).await
    }
    async fn query_bonder_meta(
        &self,
        context: &mut crate::Ctx,
        id: i64,
        category_set: Option<Vec<String>>,
    ) -> Result<
        Vec<(super::model::forum::Edge, super::model::forum::ArticleMeta)>,
        crate::custom_error::Error,
    > {
        let viewer_id = context.get_id().await;
        let bonders: Vec<_> = db::article::get_bonder_meta(viewer_id, id, opt_slice(&category_set))
            .await?
            .collect();
        complete_article(bonders, context).await
    }
    async fn query_article_meta(
        &self,
        context: &mut crate::Ctx,
        id: i64,
    ) -> Result<super::model::forum::ArticleMeta, crate::custom_error::Error> {
        let viewer_id = context.get_id().await;
        complete_article(db::article::get_meta_by_id(id, viewer_id).await?, context).await
    }
    async fn create_article(
        &self,
        context: &mut crate::Ctx,
        new_article: NewArticle,
    ) -> Result<i64, crate::custom_error::Error> {
        log::trace!(
            "發表文章： 看板 {}, 分類 {}, 標題 {}, 內容 {}",
            new_article.board_id,
            new_article.category_name,
            new_article.title,
            new_article.content
        );
        let author_id = context.get_id_strict().await?;
        let id = db::article::create(&new_article, author_id).await?;
        service::notification::handle_article(
            author_id,
            new_article.board_id,
            id,
            &new_article.bonds,
            new_article.anonymous,
        )
        .await?;
        Ok(id)
    }
    async fn query_graph(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
        category_set: Option<Vec<String>>,
    ) -> Result<super::model::forum::Graph, crate::custom_error::Error> {
        let viewer_id = context.get_id().await;
        let graph =
            service::graph_view::query_graph(viewer_id, 10, article_id, opt_slice(&category_set))
                .await?;
        complete_article(graph, context).await
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
    ) -> Fallible<model::forum::Party> {
        db::party::get_by_name(&party_name).await
    }
    async fn create_party(
        &self,
        context: &mut crate::Ctx,
        party_name: String,
        board_name: Option<String>,
    ) -> Fallible<i64> {
        let id = context.get_id_strict().await?;
        log::debug!("{} 嘗試創建 {}", id, party_name);
        let id = db::party::create(&party_name, board_name, id).await?;
        Ok(id)
    }
    async fn query_board_party_list(
        &self,
        _context: &mut crate::Ctx,
        board_id: i64,
    ) -> Fallible<Vec<model::forum::Party>> {
        db::party::get_by_board_id(board_id).await
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
    ) -> Fallible<Vec<model::forum::Board>> {
        db::board::get_all().await?.assign_props().await
    }
    async fn query_board_name_list(
        &self,
        _context: &mut crate::Ctx,
    ) -> Fallible<Vec<model::forum::BoardName>> {
        db::board::get_all_board_names().await
    }
    async fn query_board(
        &self,
        context: &mut crate::Ctx,
        name: String,
        style: String,
    ) -> Fallible<model::forum::Board> {
        let board = db::board::get_by_name(&name, &style).await?;
        if let Some(user_id) = context.get_id().await {
            service::hot_boards::set_board_pop(user_id, board.id).await?;
        }
        board.assign_props().await
    }
    async fn query_board_by_id(
        &self,
        context: &mut crate::Ctx,
        id: i64,
    ) -> Fallible<model::forum::Board> {
        let board = db::board::get_by_id(id).await?;
        if let Some(user_id) = context.get_id().await {
            service::hot_boards::set_board_pop(user_id, board.id).await?;
        }
        board.assign_props().await
    }
    async fn create_board(
        &self,
        _context: &mut crate::Ctx,
        new_board: model::forum::NewBoard,
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
    ) -> Result<Vec<super::model::forum::BoardOverview>, crate::custom_error::Error> {
        let board_ids = service::hot_boards::get_hot_boards().await?;
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
    async fn record_signup_apply(
        &self,
        context: &mut crate::Ctx,
        email: String,
        birth_year: i32,
        gender: String,
        license_id: String,
        is_invite: bool,
    ) -> Result<(), crate::custom_error::Error> {
        let inviter_id = if is_invite {
            Some(context.get_id_strict().await?)
        } else {
            None
        };
        db::user::create_signup_token(&email, birth_year, &gender, &license_id, inviter_id).await
    }
    async fn query_search_result_from_lawyerbc(
        &self,
        _context: &mut crate::Ctx,
        search_text: String,
    ) -> Result<Vec<model::forum::LawyerbcResultMini>, crate::custom_error::Error> {
        db::user::query_search_result_from_lawyerbc(search_text).await
    }
    async fn query_detail_result_from_lawyerbc(
        &self,
        _context: &mut crate::Ctx,
        search_text: String,
    ) -> Result<model::forum::LawyerbcResult, crate::custom_error::Error> {
        db::user::query_detail_result_from_lawyerbc(search_text).await
    }
    async fn send_signup_email(
        &self,
        context: &mut crate::Ctx,
        email: String,
        is_invite: bool,
    ) -> Result<(), crate::custom_error::Error> {
        let conf = crate::config::get_config();
        if !conf.account.allow_self_signup && !is_invite {
            return Err(ErrorCode::NotAllowSelfSignup.into());
        }
        let inviter_id = if is_invite {
            Some(context.get_id_strict().await?)
        } else {
            None
        };
        // TODO how to get birth_year, gender, license_id if sending intivation is allowed?
        db::user::create_signup_token(&email, 0, "", "", inviter_id).await
    }
    async fn send_reset_password_email(
        &self,
        _context: &mut crate::Ctx,
        email: String,
    ) -> Result<(), crate::custom_error::Error> {
        db::user::send_reset_password_email(email).await
    }
    async fn signup(
        &self,
        context: &mut crate::Ctx,
        user_name: String,
        password: String,
        token: String,
    ) -> Result<super::model::forum::User, crate::custom_error::Error> {
        db::user::signup_by_token(&user_name, &password, &token).await?;
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
        if let Some(email) = db::user::get_email_by_signup_token(&token).await? {
            Ok(email)
        } else {
            Err(ErrorCode::NotFound(DataType::SignupToken, token).into())
        }
    }

    async fn query_user_name_by_reset_password_token(
        &self,
        _context: &mut crate::Ctx,
        token: String,
    ) -> Result<Option<String>, crate::custom_error::Error> {
        db::user::get_user_name_by_reset_password_token(&token).await
    }

    async fn reset_password_by_token(
        &self,
        _context: &mut crate::Ctx,
        password: String,
        token: String,
    ) -> Result<(), crate::custom_error::Error> {
        db::user::reset_password_by_token(&password, &token).await
    }

    async fn query_me(&self, context: &mut crate::Ctx) -> Fallible<Option<model::forum::User>> {
        if let Some(id) = context.get_id().await {
            Ok(Some(db::user::get_by_id(id).await?))
        } else {
            Ok(None)
        }
    }
    async fn query_my_party_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Fallible<Vec<model::forum::Party>> {
        let id = context.get_id_strict().await?;
        db::party::get_by_member_id(id).await
    }
    async fn query_my_favorite_article_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Fallible<Vec<model::forum::ArticleMetaWithBonds>> {
        let id = context.get_id_strict().await?;
        let metas = db::favorite::get_by_user_id(id).await?;
        let metas = complete_article(metas, context).await?;
        db::article::add_bond_to_metas(metas, Some(id)).await
    }
    async fn query_public_follower_list(
        &self,
        _context: &mut crate::Ctx,
        user: i64,
    ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error> {
        db::user_relation::query_follower(user).await
    }
    async fn query_public_hater_list(
        &self,
        _context: &mut crate::Ctx,
        user: i64,
    ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error> {
        db::user_relation::query_hater(user).await
    }
    async fn query_public_following_list(
        &self,
        _context: &mut crate::Ctx,
        user: i64,
    ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error> {
        db::user_relation::query_following(user, true).await
    }
    async fn query_public_hating_list(
        &self,
        _context: &mut crate::Ctx,
        user: i64,
    ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error> {
        db::user_relation::query_hating(user, true).await
    }
    async fn query_my_private_following_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::user_relation::query_following(id, false).await
    }
    async fn query_my_private_hating_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::user_relation::query_hating(id, false).await
    }
    async fn query_signup_invitation_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::forum::SignupInvitation>, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::user::get_signup_invitations(id).await
    }
    async fn query_signup_invitation_credit_list(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::forum::SignupInvitationCredit>, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::user::get_signup_invitation_credit(id).await
    }
    async fn query_user(
        &self,
        _context: &mut crate::Ctx,
        name: String,
    ) -> Result<super::model::forum::User, crate::custom_error::Error> {
        db::user::get_by_name(&name).await
    }
    async fn login(
        &self,
        context: &mut crate::Ctx,
        user_name: String,
        password: String,
    ) -> Fallible<Option<model::forum::User>> {
        let user = db::user::login(&user_name, &password).await?;
        context.remember_id(user.id).await?;
        Ok(Some(user))
    }
    async fn logout(&self, context: &mut crate::Ctx) -> Fallible<()> {
        context.forget_id().await
    }
    async fn query_subcribed_boards(
        &self,
        context: &mut crate::Ctx,
    ) -> Result<Vec<super::model::forum::BoardOverview>, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
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
        let id = context.get_id_strict().await?;
        db::subscribed_boards::unsubscribe(id, board_id).await
    }
    async fn subscribe_board(
        &self,
        context: &mut crate::Ctx,
        board_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::subscribed_boards::subscribe(id, board_id).await
    }
    async fn favorite_article(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
    ) -> Result<i64, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        let favorite_id = db::favorite::favorite(id, article_id).await?;
        Ok(favorite_id)
    }
    async fn unfavorite_article(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::favorite::unfavorite(id, article_id).await
    }
    async fn tracking_article(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
    ) -> Result<i64, crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        let tracking_id = db::tracking::tracking(id, article_id).await?;
        Ok(tracking_id)
    }
    async fn untracking_article(
        &self,
        context: &mut crate::Ctx,
        article_id: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::tracking::untracking(id, article_id).await
    }
    async fn create_user_relation(
        &self,
        context: &mut crate::Ctx,
        target_user: i64,
        kind: model::forum::UserRelationKind,
        is_public: bool,
    ) -> Result<(), crate::custom_error::Error> {
        let from_user = context.get_id_strict().await?;
        db::user_relation::create_relation(&model::forum::UserRelation {
            from_user,
            kind,
            is_public,
            to_user: target_user,
        })
        .await?;

        use model::forum::NotificationKind;
        let noti = |kind| {
            service::notification::create(target_user, kind, Some(from_user), None, None, None)
        };
        if is_public {
            match kind {
                model::forum::UserRelationKind::Follow => {
                    noti(NotificationKind::Follow).await?;
                }
                model::forum::UserRelationKind::Hate => {
                    noti(NotificationKind::Hate).await?;
                }
                _ => (),
            }
        }
        Ok(())
    }
    async fn delete_user_relation(
        &self,
        context: &mut crate::Ctx,
        target_user: i64,
    ) -> Result<(), crate::custom_error::Error> {
        let from_user = context.get_id_strict().await?;
        db::user_relation::delete_relation(from_user, target_user).await
    }
    async fn query_user_relation(
        &self,
        context: &mut crate::Ctx,
        target_user: i64,
    ) -> Result<super::model::forum::UserRelation, crate::custom_error::Error> {
        let from_user = context.get_id_strict().await?;
        let relation = db::user_relation::query_relation(from_user, target_user).await?;
        Ok(relation)
    }
    async fn update_avatar(
        &self,
        context: &mut crate::Ctx,
        image: String,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::avatar::update_avatar(id, image).await
    }
    async fn update_sentence(
        &self,
        context: &mut crate::Ctx,
        sentence: String,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::user::update_sentence(id, sentence).await
    }
    async fn update_information(
        &self,
        context: &mut crate::Ctx,
        introduction: String,
        job: String,
        city: String,
    ) -> Result<(), crate::custom_error::Error> {
        let id = context.get_id_strict().await?;
        db::user::update_info(id, introduction, job, city).await
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
    ) -> Result<Vec<super::model::forum::Notification>, crate::custom_error::Error> {
        let user_id = context.get_id_strict().await?;
        let notificartions = db::notification::get_by_user(user_id, all).await?;
        Ok(notificartions)
    }
    async fn read_notifications(
        &self,
        context: &mut crate::Ctx,
        ids: Vec<i64>,
    ) -> Result<(), crate::custom_error::Error> {
        let user_id = context.get_id_strict().await?;
        db::notification::read(&ids, user_id).await
    }
}

#[derive(Default)]
pub struct ConfigQueryRouter {}
#[async_trait]
impl api_trait::ConfigQueryRouter for ConfigQueryRouter {
    async fn query_config(
        &self,
        _context: &mut crate::Ctx,
    ) -> Result<super::model::forum::Config, crate::custom_error::Error> {
        let config = crate::config::get_config();
        Ok(super::model::forum::Config {
            min_password_length: config.account.min_password_length,
            max_password_length: config.account.max_password_length,
        })
    }
}
