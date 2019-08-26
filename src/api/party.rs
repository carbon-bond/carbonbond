use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;
use diesel::prelude::*;

use crate::db::{models as db_models, schema as db_schema};
use crate::custom_error::{Fallible, Error};
use crate::party;

use super::{id_to_i64, i64_to_id, Context, ContextTrait, Board};

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Party]);

pub struct Party {
    pub id: ID,
    pub party_name: String,
    pub board_id: Option<ID>,
    pub chairman_id: ID,
    pub energy: i32,
}

impl PartyFields for Party {
    fn field_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.id)
    }
    fn field_party_name(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.party_name)
    }
    fn field_board_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&Option<ID>> {
        Ok(&self.board_id)
    }
    fn field_chairman_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.chairman_id)
    }
    fn field_energy(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&i32> {
        Ok(&self.energy)
    }
    fn field_position(
        &self,
        ex: &juniper::Executor<'_, Context>,
        user_name: Option<String>,
    ) -> Fallible<i32> {
        let user_id = {
            if let Some(_name) = user_name {
                // TODO 想辦法根據 user_name 取出 user_id
                return Err(Error::new_internal_without_source("未實作"));
            } else if let Some(id) = ex.context().get_id() {
                id
            } else {
                return Ok(0);
            }
        };
        party::get_member_position(&ex.context().get_pg_conn()?, user_id, id_to_i64(&self.id)?)
            .map(|p| p as i32)
    }
    fn field_board(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Board, juniper_from_schema::Walked>,
    ) -> Fallible<Option<Board>> {
        use db_schema::boards::dsl::*;
        if let Some(board_id) = self.board_id.clone() {
            let res = boards
                .filter(id.eq(id_to_i64(&board_id)?))
                .first::<db_models::Board>(&ex.context().get_pg_conn()?);

            let b = match res {
                Err(diesel::result::Error::NotFound) => return Ok(None),
                Err(e) => return Err(e.into()),
                Ok(b) => b,
            };

            Ok(Some(Board {
                id: i64_to_id(b.id),
                detail: b.detail,
                title: b.title,
                board_name: b.board_name,
                ruling_party_id: i64_to_id(b.ruling_party_id),
            }))
        } else {
            Ok(None)
        }
    }
}
