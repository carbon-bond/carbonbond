use super::api_trait;
use super::model;
use crate::custom_error::{Error, Fallible};
use async_trait::async_trait;
use chrono::Utc;

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
        context: &crate::Ctx,
        id: u64,
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
pub struct BoardQueryRouter {}
#[async_trait]
impl api_trait::BoardQueryRouter for BoardQueryRouter {
    async fn query_board_list(
        &self,
        context: &crate::Ctx,
        count: usize,
    ) -> Fallible<Vec<model::Board>> {
        Ok(vec![
            model::Board {
                id: 1,
                board_name: "國士無雙".to_string(),
                create_time: Utc::now(),
                title: "諸將易得耳，至如信者，國士無雙".to_owned(),
                detail: "國士無雙的細節介紹......".to_owned(),
                ruling_party_id: 1,
            },
            model::Board {
                id: 2,
                board_name: "綠帽文學".to_owned(),
                create_time: Utc::now(),
                title: "愛是一道光，如此美妙".to_owned(),
                detail: "綠帽文學的細節介紹......".to_owned(),
                ruling_party_id: 2,
            },
        ])
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
        Ok(Some(model::User {
            user_name: "宋江".to_owned(),
            sentence: "他日若遂凌雲志，敢笑黃巢不丈夫".to_owned(),
            energy: 789,
            invitation_credit: 20,
        }))
    }
}
