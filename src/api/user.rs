use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;

use crate::custom_error::{Fallible, Error};

use super::Context;

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [User]);

pub struct User {
    pub id: ID,
    pub user_name: String,
    pub energy: i32,
    pub sentence: String,
}

impl UserFields for User {
    fn field_user_name(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.user_name)
    }
    fn field_energy(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&i32> {
        Ok(&self.energy)
    }
    fn field_sentence(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.sentence)
    }
}
