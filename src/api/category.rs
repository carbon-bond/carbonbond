use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;
use diesel::prelude::*;

use crate::db::{models as db_models, schema as db_schema};
use crate::custom_error::{Fallible, Error};

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Category]);

use super::{id_to_i64, i64_to_id, Context, Board};

pub struct Category {
    pub id: ID,
    pub board_id: ID,
    pub body: String,
    pub is_active: bool,
    pub replacing: Option<ID>,
}

impl CategoryFields for Category {
    fn field_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.id)
    }
    fn field_body(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.body)
    }
    fn field_is_active(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&bool> {
        Ok(&self.is_active)
    }
    fn field_board(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Board, juniper_from_schema::Walked>,
    ) -> Fallible<Board> {
        use db_schema::boards::dsl;
        let board_id = id_to_i64(&self.board_id)?;
        let board = dsl::boards
            .filter(dsl::id.eq(board_id))
            .first::<db_models::Board>(&ex.context().get_pg_conn()?)?;
        Ok(Board {
            id: self.board_id.clone(),
            board_name: board.board_name,
            title: board.title,
            detail: board.detail,
            ruling_party_id: i64_to_id(board.ruling_party_id),
        })
    }
}
