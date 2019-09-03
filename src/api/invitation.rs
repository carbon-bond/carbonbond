use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;

use crate::custom_error::{Fallible, Error};

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Invitation]);

use super::{Context};

pub struct Invitation {
    pub code: ID,
    pub inviter_name: String,
    pub invitee_email: String,
    pub words: String,
    pub is_used: bool,
}

impl InvitationFields for Invitation {
    fn field_code(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.code)
    }
    fn field_inviter_name(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.inviter_name)
    }
    fn field_invitee_email(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.invitee_email)
    }
    fn field_words(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.words)
    }
    fn field_is_used(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&bool> {
        Ok(&self.is_used)
    }
}
