use super::api_trait;
use super::model;
use crate::custom_error::Fallible;
use crate::db;
use crate::redis;
use crate::util::HasBoardProps;
use crate::Context;
use async_trait::async_trait;
use chrono::Utc;

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
    async fn query_article_list(
        &self,
        context: &mut crate::Ctx,
        board_name: Option<String>,
        author_name: Option<String>,
        count: usize,
    ) -> Fallible<Vec<model::Article>> {
        Ok(vec![model::Article {
                id: 1,
                title: "公子獻頭".to_owned(),
                content: vec!["荊軻，亦作荊柯，喜好讀書擊劍，為人慷慨俠義。後遊歷到燕國，被稱為「荊卿」，隨之由燕國的田光推薦給太子丹，拜為上卿。\n 秦滅趙國後，兵鋒直指燕國南界，太子丹震懼，與田光密謀，決定派荊軻入秦行刺秦王。荊軻獻計給太子丹，擬以秦國叛將樊於期之頭及燕督亢(今河北涿縣、易縣、固安一帶，是一塊肥沃的土地)地圖進獻秦王，伺機行刺。太子丹不忍殺樊於期，荊軻隻好私見樊於期，告以實情，樊於期為成全荊軻而自刎。".to_owned()],
                author_id: 1,
                author_name: "賈詡".to_owned(),
                root_id: 1,
                board_id: 1,
                board_name: "國士無雙".to_owned(),
                energy: 17,
                create_time: Utc::now(),
                category: "問題".to_owned(),
            },model::Article {
                id: 2,
                title: "這高鐵也太晃了".to_owned(),
                content: vec![
                    "我問：那個男的是你前男友，對嗎？".to_owned(),
                    "她點頭。".to_owned(),
                    "我問：你們昨天晚上睡一起是嗎？".to_owned(),
                    "她點頭。".to_owned(),
                    "我問：上床了，對嗎？".to_owned(),
                    "她猶豫。".to_owned(),
                    "我說不要緊的承認吧。".to_owned(),
                    "她點頭。".to_owned(),
                    "我說：昨天晚上我打電話的時候，你們正忙吧。".to_owned(),
                    "她不說話。".to_owned(),
                    "我感到天旋地轉，媽的，這高鐵也太晃了。".to_owned(),
                ],
                author_id: 2,
                author_name: "賤人".to_owned(),
                root_id: 1,
                board_id: 1,
                board_name: "綠帽文學".to_owned(),
                energy: 17,
                create_time: Utc::now(),
                category: "問題".to_owned(),
            }])
    }
    async fn query_article(
        &self,
        context: &mut crate::Ctx,
        id: i64,
    ) -> Result<model::Article, crate::custom_error::Error> {
        if id == 1 {
            Ok(model::Article {
                id: 1,
                title: "公子獻頭".to_owned(),
                content: vec!["荊軻，亦作荊柯，喜好讀書擊劍，為人慷慨俠義。後遊歷到燕國，被稱為「荊卿」，隨之由燕國的田光推薦給太子丹，拜為上卿。\n 秦滅趙國後，兵鋒直指燕國南界，太子丹震懼，與田光密謀，決定派荊軻入秦行刺秦王。荊軻獻計給太子丹，擬以秦國叛將樊於期之頭及燕督亢(今河北涿縣、易縣、固安一帶，是一塊肥沃的土地)地圖進獻秦王，伺機行刺。太子丹不忍殺樊於期，荊軻隻好私見樊於期，告以實情，樊於期為成全荊軻而自刎。".to_owned()],
                author_id: 1,
                author_name: "賈詡".to_owned(),
                root_id: 1,
                board_id: 1,
                board_name: "國士無雙".to_owned(),
                energy: 17,
                create_time: Utc::now(),
                category: "問題".to_owned(),
            })
        } else {
            Ok(model::Article {
                id: 2,
                title: "這高鐵也太晃了".to_owned(),
                content: vec![
                    "我問：那個男的是你前男友，對嗎？".to_owned(),
                    "她點頭。".to_owned(),
                    "我問：你們昨天晚上睡一起是嗎？".to_owned(),
                    "她點頭。".to_owned(),
                    "我問：上床了，對嗎？".to_owned(),
                    "她猶豫。".to_owned(),
                    "我說不要緊的承認吧。".to_owned(),
                    "她點頭。".to_owned(),
                    "我說：昨天晚上我打電話的時候，你們正忙吧。".to_owned(),
                    "她不說話。".to_owned(),
                    "我感到天旋地轉，媽的，這高鐵也太晃了。".to_owned(),
                ],
                author_id: 2,
                author_name: "賤人".to_owned(),
                root_id: 1,
                board_id: 1,
                board_name: "綠帽文學".to_owned(),
                energy: 17,
                create_time: Utc::now(),
                category: "問題".to_owned(),
            })
        }
    }
}

#[derive(Default)]
pub struct PartyQueryRouter {}
#[async_trait]
impl api_trait::PartyQueryRouter for PartyQueryRouter {
    async fn query_party(
        &self,
        context: &mut crate::Ctx,
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
        context: &mut crate::Ctx,
        count: usize,
    ) -> Fallible<Vec<model::Board>> {
        db::board::get_all().await?.assign_props().await
    }
    async fn query_board_name_list(
        &self,
        context: &mut crate::Ctx,
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
        context: &mut crate::Ctx,
        id: i64,
    ) -> Result<usize, crate::custom_error::Error> {
        db::subscribed_boards::get_subscribed_user_count(id).await
    }
    async fn query_hot_boards(
        &self,
        context: &mut crate::Ctx,
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
        context: &mut crate::Ctx,
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
        target_user: i64,
        kind: model::UserRelationKind,
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
