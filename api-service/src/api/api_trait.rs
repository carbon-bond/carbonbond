use async_trait::async_trait;
use crate::api::query::*;
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde_json::error::Error;
#[async_trait]
pub trait UserQueryRouter {
    async fn query_me(&self, context: &mut crate::Ctx, ) -> Result<Option<super::model::User>, crate::custom_error::Error>;
    async fn query_my_party_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::Party>, crate::custom_error::Error>;
    async fn query_my_favorite_article_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::Favorite>, crate::custom_error::Error>;
    async fn send_signup_email(&self, context: &mut crate::Ctx, email: String) -> Result<(), crate::custom_error::Error>;
    async fn signup(&self, context: &mut crate::Ctx, user_name: String, password: String, token: String) -> Result<super::model::User, crate::custom_error::Error>;
    async fn query_email_by_token(&self, context: &mut crate::Ctx, token: String) -> Result<String, crate::custom_error::Error>;
    async fn login(&self, context: &mut crate::Ctx, user_name: String, password: String) -> Result<Option<super::model::User>, crate::custom_error::Error>;
    async fn logout(&self, context: &mut crate::Ctx, ) -> Result<(), crate::custom_error::Error>;
    async fn query_user(&self, context: &mut crate::Ctx, name: String) -> Result<super::model::User, crate::custom_error::Error>;
    async fn query_subcribed_boards(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::BoardOverview>, crate::custom_error::Error>;
    async fn subscribe_board(&self, context: &mut crate::Ctx, board_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn unsubscribe_board(&self, context: &mut crate::Ctx, board_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn favorite_article(&self, context: &mut crate::Ctx, article_id: i64) -> Result<i64, crate::custom_error::Error>;
    async fn unfavorite_article(&self, context: &mut crate::Ctx, article_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn create_user_relation(&self, context: &mut crate::Ctx, target_user: i64, kind: super::model::UserRelationKind) -> Result<(), crate::custom_error::Error>;
    async fn delete_user_relation(&self, context: &mut crate::Ctx, target_user: i64) -> Result<(), crate::custom_error::Error>;
    async fn query_user_relation(&self, context: &mut crate::Ctx, target_user: i64) -> Result<super::model::UserRelationKind, crate::custom_error::Error>;
    async fn query_follower_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::UserMini>, crate::custom_error::Error>;
    async fn query_hater_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::UserMini>, crate::custom_error::Error>;
    async fn query_signup_invitation_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::SignupInvitation>, crate::custom_error::Error>;
    async fn add_signup_invitation(&self, context: &mut crate::Ctx, user: i64, description: String) -> Result<i64, crate::custom_error::Error>;
    async fn activate_signup_invitation(&self, context: &mut crate::Ctx, signup_invitation_id: i64) -> Result<String, crate::custom_error::Error>;
    async fn deactivate_signup_invitation(&self, context: &mut crate::Ctx, signup_invitation_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn update_avatar(&self, context: &mut crate::Ctx, image: String) -> Result<(), crate::custom_error::Error>;
    async fn update_sentence(&self, context: &mut crate::Ctx, sentence: String) -> Result<(), crate::custom_error::Error>;
    async fn update_information(&self, context: &mut crate::Ctx, introduction: String, gender: String, job: String, city: String) -> Result<(), crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: UserQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             UserQuery::QueryMe {  } => {
                 let resp = self.query_me(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryMyPartyList {  } => {
                 let resp = self.query_my_party_list(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryMyFavoriteArticleList {  } => {
                 let resp = self.query_my_favorite_article_list(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::SendSignupEmail { email } => {
                 let resp = self.send_signup_email(context, email).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::Signup { user_name, password, token } => {
                 let resp = self.signup(context, user_name, password, token).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryEmailByToken { token } => {
                 let resp = self.query_email_by_token(context, token).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::Login { user_name, password } => {
                 let resp = self.login(context, user_name, password).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::Logout {  } => {
                 let resp = self.logout(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryUser { name } => {
                 let resp = self.query_user(context, name).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QuerySubcribedBoards {  } => {
                 let resp = self.query_subcribed_boards(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::SubscribeBoard { board_id } => {
                 let resp = self.subscribe_board(context, board_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::UnsubscribeBoard { board_id } => {
                 let resp = self.unsubscribe_board(context, board_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::FavoriteArticle { article_id } => {
                 let resp = self.favorite_article(context, article_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::UnfavoriteArticle { article_id } => {
                 let resp = self.unfavorite_article(context, article_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::CreateUserRelation { target_user, kind } => {
                 let resp = self.create_user_relation(context, target_user, kind).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::DeleteUserRelation { target_user } => {
                 let resp = self.delete_user_relation(context, target_user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryUserRelation { target_user } => {
                 let resp = self.query_user_relation(context, target_user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryFollowerList { user } => {
                 let resp = self.query_follower_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QueryHaterList { user } => {
                 let resp = self.query_hater_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::QuerySignupInvitationList { user } => {
                 let resp = self.query_signup_invitation_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::AddSignupInvitation { user, description } => {
                 let resp = self.add_signup_invitation(context, user, description).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::ActivateSignupInvitation { signup_invitation_id } => {
                 let resp = self.activate_signup_invitation(context, signup_invitation_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::DeactivateSignupInvitation { signup_invitation_id } => {
                 let resp = self.deactivate_signup_invitation(context, signup_invitation_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::UpdateAvatar { image } => {
                 let resp = self.update_avatar(context, image).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::UpdateSentence { sentence } => {
                 let resp = self.update_sentence(context, sentence).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             UserQuery::UpdateInformation { introduction, gender, job, city } => {
                 let resp = self.update_information(context, introduction, gender, job, city).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
        }
    }
}
#[async_trait]
pub trait PartyQueryRouter {
    async fn query_party(&self, context: &mut crate::Ctx, party_name: String) -> Result<super::model::Party, crate::custom_error::Error>;
    async fn create_party(&self, context: &mut crate::Ctx, party_name: String, board_name: Option<String>) -> Result<i64, crate::custom_error::Error>;
    async fn query_board_party_list(&self, context: &mut crate::Ctx, board_id: i64) -> Result<Vec<super::model::Party>, crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: PartyQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             PartyQuery::QueryParty { party_name } => {
                 let resp = self.query_party(context, party_name).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             PartyQuery::CreateParty { party_name, board_name } => {
                 let resp = self.create_party(context, party_name, board_name).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             PartyQuery::QueryBoardPartyList { board_id } => {
                 let resp = self.query_board_party_list(context, board_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
        }
    }
}
#[async_trait]
pub trait ArticleQueryRouter {
    async fn query_article_list(&self, context: &mut crate::Ctx, count: usize, max_id: Option<i64>, author_name: Option<String>, board_name: Option<String>, family_filter: super::model::FamilyFilter) -> Result<Vec<super::model::ArticleMeta>, crate::custom_error::Error>;
    async fn query_article(&self, context: &mut crate::Ctx, id: i64) -> Result<super::model::Article, crate::custom_error::Error>;
    async fn query_article_meta(&self, context: &mut crate::Ctx, id: i64) -> Result<super::model::ArticleMeta, crate::custom_error::Error>;
    async fn query_bonder(&self, context: &mut crate::Ctx, id: i64, category_set: Option<Vec<String>>, family_filter: super::model::FamilyFilter) -> Result<Vec<(super::model::Edge, super::model::Article)>, crate::custom_error::Error>;
    async fn query_bonder_meta(&self, context: &mut crate::Ctx, id: i64, category_set: Option<Vec<String>>, family_filter: super::model::FamilyFilter) -> Result<Vec<(super::model::Edge, super::model::ArticleMeta)>, crate::custom_error::Error>;
    async fn create_article(&self, context: &mut crate::Ctx, board_id: i64, category_name: String, title: String, content: String) -> Result<i64, crate::custom_error::Error>;
    async fn search_article(&self, context: &mut crate::Ctx, author_name: Option<String>, board_name: Option<String>, start_time: Option<DateTime<Utc>>, end_time: Option<DateTime<Utc>>, category: Option<i64>, title: Option<String>, content: HashMap<String,super::model::SearchField>) -> Result<Vec<super::model::ArticleMeta>, crate::custom_error::Error>;
    async fn query_graph(&self, context: &mut crate::Ctx, article_id: i64, category_set: Option<Vec<String>>, family_filter: super::model::FamilyFilter) -> Result<super::model::Graph, crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: ArticleQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             ArticleQuery::QueryArticleList { count, max_id, author_name, board_name, family_filter } => {
                 let resp = self.query_article_list(context, count, max_id, author_name, board_name, family_filter).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::QueryArticle { id } => {
                 let resp = self.query_article(context, id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::QueryArticleMeta { id } => {
                 let resp = self.query_article_meta(context, id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::QueryBonder { id, category_set, family_filter } => {
                 let resp = self.query_bonder(context, id, category_set, family_filter).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::QueryBonderMeta { id, category_set, family_filter } => {
                 let resp = self.query_bonder_meta(context, id, category_set, family_filter).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::CreateArticle { board_id, category_name, title, content } => {
                 let resp = self.create_article(context, board_id, category_name, title, content).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::SearchArticle { author_name, board_name, start_time, end_time, category, title, content } => {
                 let resp = self.search_article(context, author_name, board_name, start_time, end_time, category, title, content).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             ArticleQuery::QueryGraph { article_id, category_set, family_filter } => {
                 let resp = self.query_graph(context, article_id, category_set, family_filter).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
        }
    }
}
#[async_trait]
pub trait BoardQueryRouter {
    async fn query_board_list(&self, context: &mut crate::Ctx, count: usize) -> Result<Vec<super::model::Board>, crate::custom_error::Error>;
    async fn query_board_name_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::BoardName>, crate::custom_error::Error>;
    async fn query_board(&self, context: &mut crate::Ctx, name: String, style: String) -> Result<super::model::Board, crate::custom_error::Error>;
    async fn query_board_by_id(&self, context: &mut crate::Ctx, id: i64) -> Result<super::model::Board, crate::custom_error::Error>;
    async fn query_subscribed_user_count(&self, context: &mut crate::Ctx, id: i64) -> Result<usize, crate::custom_error::Error>;
    async fn create_board(&self, context: &mut crate::Ctx, new_board: super::model::NewBoard) -> Result<i64, crate::custom_error::Error>;
    async fn query_hot_boards(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::BoardOverview>, crate::custom_error::Error>;
    async fn query_category_by_id(&self, context: &mut crate::Ctx, id: i64) -> Result<String, crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: BoardQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             BoardQuery::QueryBoardList { count } => {
                 let resp = self.query_board_list(context, count).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::QueryBoardNameList {  } => {
                 let resp = self.query_board_name_list(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::QueryBoard { name, style } => {
                 let resp = self.query_board(context, name, style).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::QueryBoardById { id } => {
                 let resp = self.query_board_by_id(context, id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::QuerySubscribedUserCount { id } => {
                 let resp = self.query_subscribed_user_count(context, id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::CreateBoard { new_board } => {
                 let resp = self.create_board(context, new_board).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::QueryHotBoards {  } => {
                 let resp = self.query_hot_boards(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             BoardQuery::QueryCategoryById { id } => {
                 let resp = self.query_category_by_id(context, id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
        }
    }
}
#[async_trait]
pub trait NotificationQueryRouter {
    async fn query_notification_by_user(&self, context: &mut crate::Ctx, all: bool) -> Result<Vec<super::model::Notification>, crate::custom_error::Error>;
    async fn read_notifications(&self, context: &mut crate::Ctx, ids: Vec<i64>) -> Result<(), crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: NotificationQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             NotificationQuery::QueryNotificationByUser { all } => {
                 let resp = self.query_notification_by_user(context, all).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
             NotificationQuery::ReadNotifications { ids } => {
                 let resp = self.read_notifications(context, ids).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
             }
        }
    }
}
#[async_trait]
pub trait RootQueryRouter {
    type UserQueryRouter: UserQueryRouter + Sync;
    type PartyQueryRouter: PartyQueryRouter + Sync;
    type ArticleQueryRouter: ArticleQueryRouter + Sync;
    type BoardQueryRouter: BoardQueryRouter + Sync;
    type NotificationQueryRouter: NotificationQueryRouter + Sync;
    fn user_router(&self) -> &Self::UserQueryRouter;
    fn party_router(&self) -> &Self::PartyQueryRouter;
    fn article_router(&self) -> &Self::ArticleQueryRouter;
    fn board_router(&self) -> &Self::BoardQueryRouter;
    fn notification_router(&self) -> &Self::NotificationQueryRouter;
    async fn handle(&self, context: &mut crate::Ctx, query: RootQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             RootQuery::User(query) => {
                 self.user_router().handle(context, query).await
             }
             RootQuery::Party(query) => {
                 self.party_router().handle(context, query).await
             }
             RootQuery::Article(query) => {
                 self.article_router().handle(context, query).await
             }
             RootQuery::Board(query) => {
                 self.board_router().handle(context, query).await
             }
             RootQuery::Notification(query) => {
                 self.notification_router().handle(context, query).await
             }
        }
    }
}