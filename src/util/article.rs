use crate::api::model::{Article, ArticleMeta, Favorite, Graph};
use crate::custom_error::Fallible;
use crate::db::article_statistics;
use async_trait::async_trait;

#[async_trait]
pub trait HasArticleStats: Sized {
    async fn assign_stats_in_place(&mut self) -> Fallible;
    async fn assign_stats(mut self) -> Fallible<Self> {
        self.assign_stats_in_place().await?;
        Ok(self)
    }
}

pub trait ArticleKind {
    fn meta(&mut self) -> &mut ArticleMeta;
}

#[async_trait]
impl<T: ArticleKind + Send + Sync> HasArticleStats for T {
    async fn assign_stats_in_place(&mut self) -> Fallible {
        // TODO: 進快取撈看看
        article_statistics::get(vec![self.meta()]).await
    }
}

#[async_trait]
impl<T: ArticleKind + Send + Sync> HasArticleStats for Vec<T> {
    async fn assign_stats_in_place(&mut self) -> Fallible {
        // TODO: 進快取撈看看
        let metas: Vec<_> = self.iter_mut().map(|a| a.meta()).collect();
        article_statistics::get(metas).await
    }
}

impl ArticleKind for ArticleMeta {
    fn meta(&mut self) -> &mut ArticleMeta {
        self
    }
}

impl ArticleKind for Article {
    fn meta(&mut self) -> &mut ArticleMeta {
        &mut self.meta
    }
}
impl ArticleKind for Favorite {
    fn meta(&mut self) -> &mut ArticleMeta {
        &mut self.meta
    }
}
impl<T, A: ArticleKind> ArticleKind for (T, A) {
    fn meta(&mut self) -> &mut ArticleMeta {
        self.1.meta()
    }
}

#[async_trait]
impl HasArticleStats for Graph {
    async fn assign_stats_in_place(&mut self) -> Fallible {
        self.nodes.assign_stats_in_place().await
    }
}
