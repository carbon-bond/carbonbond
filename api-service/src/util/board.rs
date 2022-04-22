use crate::api::model::forum::{Board, BoardOverview};
use crate::custom_error::Fallible;
use crate::service;
use async_trait::async_trait;

#[async_trait]
pub trait HasBoardProps: Sized {
    async fn assign_props_in_place(&mut self) -> Fallible;
    async fn assign_props(mut self) -> Fallible<Self> {
        self.assign_props_in_place().await?;
        Ok(self)
    }
}

pub trait BoardKind {
    fn id(&self) -> i64;
    fn popularity(&mut self) -> &mut i64;
}

#[async_trait]
impl<T: BoardKind + Sync + Send + Sized> HasBoardProps for T {
    async fn assign_props_in_place(&mut self) -> Fallible {
        let pop = service::hot_boards::get_board_pop(self.id()).await?;
        *self.popularity() = pop;
        Ok(())
    }
}

#[async_trait]
impl<T: HasBoardProps + Send> HasBoardProps for Vec<T> {
    async fn assign_props_in_place(&mut self) -> Fallible {
        for b in self.iter_mut() {
            b.assign_props_in_place().await?;
        }
        Ok(())
    }
}

impl BoardKind for Board {
    fn id(&self) -> i64 {
        self.id
    }
    fn popularity(&mut self) -> &mut i64 {
        &mut self.popularity
    }
}

impl BoardKind for BoardOverview {
    fn id(&self) -> i64 {
        self.id
    }
    fn popularity(&mut self) -> &mut i64 {
        &mut self.popularity
    }
}
