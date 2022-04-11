use crate::api::query::*;
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use async_trait::async_trait;
use serde_json::error::Error;
#[async_trait]
pub trait ChatQueryRouter {
    async fn create_chat_if_not_exist(&self, context: &mut crate::Ctx, opposite_id: i64, msg: String) -> Result<i64, crate::custom_error::Error>;
    async fn query_direct_chat_history(&self, context: &mut crate::Ctx, chat_id: i64, last_msg_id: i64, number: i64) -> Result<Vec<super::model::chat::chat_model_root::server_trigger::Message>, crate::custom_error::Error>;
    async fn update_read_time(&self, context: &mut crate::Ctx, chat_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: ChatQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             ChatQuery::CreateChatIfNotExist { opposite_id, msg } => {
                 let resp = self.create_chat_if_not_exist(context, opposite_id, msg).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ChatQuery::QueryDirectChatHistory { chat_id, last_msg_id, number } => {
                 let resp = self.query_direct_chat_history(context, chat_id, last_msg_id, number).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ChatQuery::UpdateReadTime { chat_id } => {
                 let resp = self.update_read_time(context, chat_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
        }
    }
}
#[async_trait]
pub trait UserQueryRouter {
    async fn query_me(&self, context: &mut crate::Ctx, ) -> Result<Option<super::model::forum::User>, crate::custom_error::Error>;
    async fn query_my_party_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::Party>, crate::custom_error::Error>;
    async fn query_my_favorite_article_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::ArticleMetaWithBonds>, crate::custom_error::Error>;
    async fn query_search_result_from_lawyerbc(&self, context: &mut crate::Ctx, search_text: String) -> Result<Vec<super::model::forum::LawyerbcResultMini>, crate::custom_error::Error>;
    async fn query_detail_result_from_lawyerbc(&self, context: &mut crate::Ctx, license_id: String) -> Result<super::model::forum::LawyerbcResult, crate::custom_error::Error>;
    async fn record_signup_apply(&self, context: &mut crate::Ctx, email: String, birth_year: i32, gender: String, license_id: String, is_invite: bool) -> Result<(), crate::custom_error::Error>;
    async fn send_signup_email(&self, context: &mut crate::Ctx, email: String, is_invite: bool) -> Result<(), crate::custom_error::Error>;
    async fn send_reset_password_email(&self, context: &mut crate::Ctx, email: String) -> Result<(), crate::custom_error::Error>;
    async fn signup(&self, context: &mut crate::Ctx, user_name: String, password: String, token: String) -> Result<super::model::forum::User, crate::custom_error::Error>;
    async fn query_email_by_token(&self, context: &mut crate::Ctx, token: String) -> Result<String, crate::custom_error::Error>;
    async fn query_user_name_by_reset_password_token(&self, context: &mut crate::Ctx, token: String) -> Result<Option<String>, crate::custom_error::Error>;
    async fn reset_password_by_token(&self, context: &mut crate::Ctx, password: String, token: String) -> Result<(), crate::custom_error::Error>;
    async fn login(&self, context: &mut crate::Ctx, user_name: String, password: String) -> Result<Option<super::model::forum::User>, crate::custom_error::Error>;
    async fn logout(&self, context: &mut crate::Ctx, ) -> Result<(), crate::custom_error::Error>;
    async fn query_user(&self, context: &mut crate::Ctx, name: String) -> Result<super::model::forum::User, crate::custom_error::Error>;
    async fn query_subcribed_boards(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::BoardOverview>, crate::custom_error::Error>;
    async fn subscribe_board(&self, context: &mut crate::Ctx, board_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn unsubscribe_board(&self, context: &mut crate::Ctx, board_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn favorite_article(&self, context: &mut crate::Ctx, article_id: i64) -> Result<i64, crate::custom_error::Error>;
    async fn unfavorite_article(&self, context: &mut crate::Ctx, article_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn tracking_article(&self, context: &mut crate::Ctx, article_id: i64) -> Result<i64, crate::custom_error::Error>;
    async fn untracking_article(&self, context: &mut crate::Ctx, article_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn create_user_relation(&self, context: &mut crate::Ctx, target_user: i64, kind: super::model::forum::UserRelationKind, is_public: bool) -> Result<(), crate::custom_error::Error>;
    async fn delete_user_relation(&self, context: &mut crate::Ctx, target_user: i64) -> Result<(), crate::custom_error::Error>;
    async fn query_user_relation(&self, context: &mut crate::Ctx, target_user: i64) -> Result<super::model::forum::UserRelation, crate::custom_error::Error>;
    async fn query_public_follower_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error>;
    async fn query_public_hater_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error>;
    async fn query_public_following_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error>;
    async fn query_public_hating_list(&self, context: &mut crate::Ctx, user: i64) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error>;
    async fn query_my_private_following_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error>;
    async fn query_my_private_hating_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::UserMini>, crate::custom_error::Error>;
    async fn query_signup_invitation_credit_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::SignupInvitationCredit>, crate::custom_error::Error>;
    async fn query_signup_invitation_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::SignupInvitation>, crate::custom_error::Error>;
    async fn update_avatar(&self, context: &mut crate::Ctx, image: String) -> Result<(), crate::custom_error::Error>;
    async fn update_sentence(&self, context: &mut crate::Ctx, sentence: String) -> Result<(), crate::custom_error::Error>;
    async fn update_information(&self, context: &mut crate::Ctx, introduction: String, job: String, city: String) -> Result<(), crate::custom_error::Error>;
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
             UserQuery::QuerySearchResultFromLawyerbc { search_text } => {
                 let resp = self.query_search_result_from_lawyerbc(context, search_text).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QueryDetailResultFromLawyerbc { license_id } => {
                 let resp = self.query_detail_result_from_lawyerbc(context, license_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::RecordSignupApply { email, birth_year, gender, license_id, is_invite } => {
                 let resp = self.record_signup_apply(context, email, birth_year, gender, license_id, is_invite).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::SendSignupEmail { email, is_invite } => {
                 let resp = self.send_signup_email(context, email, is_invite).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::SendResetPasswordEmail { email } => {
                 let resp = self.send_reset_password_email(context, email).await;
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
             UserQuery::QueryUserNameByResetPasswordToken { token } => {
                 let resp = self.query_user_name_by_reset_password_token(context, token).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::ResetPasswordByToken { password, token } => {
                 let resp = self.reset_password_by_token(context, password, token).await;
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
             UserQuery::TrackingArticle { article_id } => {
                 let resp = self.tracking_article(context, article_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::UntrackingArticle { article_id } => {
                 let resp = self.untracking_article(context, article_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::CreateUserRelation { target_user, kind, is_public } => {
                 let resp = self.create_user_relation(context, target_user, kind, is_public).await;
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
             UserQuery::QueryPublicFollowerList { user } => {
                 let resp = self.query_public_follower_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QueryPublicHaterList { user } => {
                 let resp = self.query_public_hater_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QueryPublicFollowingList { user } => {
                 let resp = self.query_public_following_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QueryPublicHatingList { user } => {
                 let resp = self.query_public_hating_list(context, user).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QueryMyPrivateFollowingList {  } => {
                 let resp = self.query_my_private_following_list(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QueryMyPrivateHatingList {  } => {
                 let resp = self.query_my_private_hating_list(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QuerySignupInvitationCreditList {  } => {
                 let resp = self.query_signup_invitation_credit_list(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             UserQuery::QuerySignupInvitationList {  } => {
                 let resp = self.query_signup_invitation_list(context, ).await;
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
             UserQuery::UpdateInformation { introduction, job, city } => {
                 let resp = self.update_information(context, introduction, job, city).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
        }
    }
}
#[async_trait]
pub trait PartyQueryRouter {
    async fn query_party(&self, context: &mut crate::Ctx, party_name: String) -> Result<super::model::forum::Party, crate::custom_error::Error>;
    async fn create_party(&self, context: &mut crate::Ctx, party_name: String, board_name: Option<String>) -> Result<i64, crate::custom_error::Error>;
    async fn query_board_party_list(&self, context: &mut crate::Ctx, board_id: i64) -> Result<Vec<super::model::forum::Party>, crate::custom_error::Error>;
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
    async fn query_article_list(&self, context: &mut crate::Ctx, count: usize, max_id: Option<i64>, author_name: Option<String>, board_name: Option<String>) -> Result<Vec<super::model::forum::ArticleMetaWithBonds>, crate::custom_error::Error>;
    async fn query_article(&self, context: &mut crate::Ctx, id: i64) -> Result<super::model::forum::Article, crate::custom_error::Error>;
    async fn query_article_meta(&self, context: &mut crate::Ctx, id: i64) -> Result<super::model::forum::ArticleMeta, crate::custom_error::Error>;
    async fn query_bonder(&self, context: &mut crate::Ctx, id: i64, category_set: Option<Vec<String>>) -> Result<Vec<(super::model::forum::Edge, super::model::forum::Article)>, crate::custom_error::Error>;
    async fn query_bonder_meta(&self, context: &mut crate::Ctx, id: i64, category_set: Option<Vec<String>>) -> Result<Vec<(super::model::forum::Edge, super::model::forum::ArticleMeta)>, crate::custom_error::Error>;
    async fn query_comment_list(&self, context: &mut crate::Ctx, article_id: i64) -> Result<Vec<super::model::forum::Comment>, crate::custom_error::Error>;
    async fn create_comment(&self, context: &mut crate::Ctx, article_id: i64, content: String, anonymous: bool) -> Result<i64, crate::custom_error::Error>;
    async fn create_article(&self, context: &mut crate::Ctx, new_article: super::model::forum::NewArticle) -> Result<i64, crate::custom_error::Error>;
    async fn save_draft(&self, context: &mut crate::Ctx, draft_id: Option<i64>, board_id: i64, category_name: Option<String>, title: String, content: String, bonds: String, anonymous: bool) -> Result<i64, crate::custom_error::Error>;
    async fn query_draft(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::Draft>, crate::custom_error::Error>;
    async fn delete_draft(&self, context: &mut crate::Ctx, draft_id: i64) -> Result<(), crate::custom_error::Error>;
    async fn search_article(&self, context: &mut crate::Ctx, author_name: Option<String>, board_name: Option<String>, start_time: Option<DateTime<Utc>>, end_time: Option<DateTime<Utc>>, category: Option<String>, title: Option<String>, content: HashMap<String,super::model::forum::SearchField>) -> Result<Vec<super::model::forum::ArticleMetaWithBonds>, crate::custom_error::Error>;
    async fn search_pop_article(&self, context: &mut crate::Ctx, count: usize) -> Result<Vec<super::model::forum::ArticleMetaWithBonds>, crate::custom_error::Error>;
    async fn get_subscribe_article(&self, context: &mut crate::Ctx, count: usize) -> Result<Vec<super::model::forum::ArticleMetaWithBonds>, crate::custom_error::Error>;
    async fn query_graph(&self, context: &mut crate::Ctx, article_id: i64, category_set: Option<Vec<String>>) -> Result<super::model::forum::Graph, crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: ArticleQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             ArticleQuery::QueryArticleList { count, max_id, author_name, board_name } => {
                 let resp = self.query_article_list(context, count, max_id, author_name, board_name).await;
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
             ArticleQuery::QueryBonder { id, category_set } => {
                 let resp = self.query_bonder(context, id, category_set).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::QueryBonderMeta { id, category_set } => {
                 let resp = self.query_bonder_meta(context, id, category_set).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::QueryCommentList { article_id } => {
                 let resp = self.query_comment_list(context, article_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::CreateComment { article_id, content, anonymous } => {
                 let resp = self.create_comment(context, article_id, content, anonymous).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::CreateArticle { new_article } => {
                 let resp = self.create_article(context, new_article).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::SaveDraft { draft_id, board_id, category_name, title, content, bonds, anonymous } => {
                 let resp = self.save_draft(context, draft_id, board_id, category_name, title, content, bonds, anonymous).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::QueryDraft {  } => {
                 let resp = self.query_draft(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::DeleteDraft { draft_id } => {
                 let resp = self.delete_draft(context, draft_id).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::SearchArticle { author_name, board_name, start_time, end_time, category, title, content } => {
                 let resp = self.search_article(context, author_name, board_name, start_time, end_time, category, title, content).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::SearchPopArticle { count } => {
                 let resp = self.search_pop_article(context, count).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::GetSubscribeArticle { count } => {
                 let resp = self.get_subscribe_article(context, count).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
             ArticleQuery::QueryGraph { article_id, category_set } => {
                 let resp = self.query_graph(context, article_id, category_set).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
        }
    }
}
#[async_trait]
pub trait BoardQueryRouter {
    async fn query_board_list(&self, context: &mut crate::Ctx, count: usize) -> Result<Vec<super::model::forum::Board>, crate::custom_error::Error>;
    async fn query_board_name_list(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::BoardName>, crate::custom_error::Error>;
    async fn query_board(&self, context: &mut crate::Ctx, name: String, style: String) -> Result<super::model::forum::Board, crate::custom_error::Error>;
    async fn query_board_by_id(&self, context: &mut crate::Ctx, id: i64) -> Result<super::model::forum::Board, crate::custom_error::Error>;
    async fn query_subscribed_user_count(&self, context: &mut crate::Ctx, id: i64) -> Result<usize, crate::custom_error::Error>;
    async fn create_board(&self, context: &mut crate::Ctx, new_board: super::model::forum::NewBoard) -> Result<i64, crate::custom_error::Error>;
    async fn query_hot_boards(&self, context: &mut crate::Ctx, ) -> Result<Vec<super::model::forum::BoardOverview>, crate::custom_error::Error>;
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
        }
    }
}
#[async_trait]
pub trait NotificationQueryRouter {
    async fn query_notification_by_user(&self, context: &mut crate::Ctx, all: bool) -> Result<Vec<super::model::forum::Notification>, crate::custom_error::Error>;
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
pub trait ConfigQueryRouter {
    async fn query_config(&self, context: &mut crate::Ctx, ) -> Result<super::model::forum::Config, crate::custom_error::Error>;
    async fn handle(&self, context: &mut crate::Ctx, query: ConfigQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             ConfigQuery::QueryConfig {  } => {
                 let resp = self.query_config(context, ).await;
                 let s = serde_json::to_string(&resp)?;
                 Ok((s, resp.err()))
            }
        }
    }
}
#[async_trait]
pub trait RootQueryRouter {
    type ChatQueryRouter: ChatQueryRouter + Sync;
    type UserQueryRouter: UserQueryRouter + Sync;
    type PartyQueryRouter: PartyQueryRouter + Sync;
    type ArticleQueryRouter: ArticleQueryRouter + Sync;
    type BoardQueryRouter: BoardQueryRouter + Sync;
    type NotificationQueryRouter: NotificationQueryRouter + Sync;
    type ConfigQueryRouter: ConfigQueryRouter + Sync;
   fn chat_router(&self) -> &Self::ChatQueryRouter;
   fn user_router(&self) -> &Self::UserQueryRouter;
   fn party_router(&self) -> &Self::PartyQueryRouter;
   fn article_router(&self) -> &Self::ArticleQueryRouter;
   fn board_router(&self) -> &Self::BoardQueryRouter;
   fn notification_router(&self) -> &Self::NotificationQueryRouter;
   fn config_router(&self) -> &Self::ConfigQueryRouter;
    async fn handle(&self, context: &mut crate::Ctx, query: RootQuery) -> Result<(String, Option<crate::custom_error::Error>), Error> {
        match query {
             RootQuery::Chat(query) => {
                 self.chat_router().handle(context, query).await
            }
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
             RootQuery::Config(query) => {
                 self.config_router().handle(context, query).await
            }
        }
    }
}
