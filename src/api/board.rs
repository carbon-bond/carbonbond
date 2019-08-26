use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;
use diesel::prelude::*;

use crate::db::{models as db_models, schema as db_schema};
use crate::custom_error::{Fallible, Error};

use super::{id_to_i64, i64_to_id, Context, Party, Category};

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Board]);

pub struct Board {
    pub id: ID,
    pub board_name: String,
    pub ruling_party_id: ID,
    pub title: String,
    pub detail: String,
}

impl BoardFields for Board {
    fn field_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.id)
    }
    fn field_board_name(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.board_name)
    }
    fn field_title(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.title)
    }
    fn field_detail(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.detail)
    }
    fn field_ruling_party_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.ruling_party_id)
    }
    fn field_parties(
        &self,
        _ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Party, juniper_from_schema::Walked>,
    ) -> Fallible<Vec<Party>> {
        Ok(vec![]) // TODO: 抓出政黨
    }
    fn field_categories(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Category, juniper_from_schema::Walked>,
    ) -> Fallible<Vec<Category>> {
        use db_schema::categories::dsl::*;
        let results = categories
            .filter(board_id.eq(id_to_i64(&self.id)?))
            .load::<db_models::Category>(&ex.context().get_pg_conn()?)?;
        Ok(results
            .into_iter()
            .map(|t| Category {
                id: ID::new(t.id.to_string()),
                board_id: i64_to_id(t.board_id),
                body: t.body,
                is_active: t.is_active,
                replacing: t.replacing.map(|t| i64_to_id(t)),
            })
            .collect())
    }
    fn field_article_count(
        &self,
        ex: &juniper::Executor<'_, Context>,
        show_hidden: Option<bool>,
    ) -> Fallible<i32> {
        use db_schema::articles::dsl;
        let show_hidden = show_hidden.unwrap_or(false);
        let mut query = dsl::articles.into_boxed();
        if !show_hidden {
            query = query.filter(dsl::show_in_list.eq(true));
        }
        let count = query
            .filter(dsl::board_id.eq(id_to_i64(&self.id)?))
            .count()
            .get_result::<i64>(&ex.context().get_pg_conn()?)?;
        Ok(count as i32)
    }
}
