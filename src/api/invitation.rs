use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;

use crate::custom_error::{Fallible, Error};
use crate::user::find_user_by_id;

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Invitation]);

use super::{Context, User, i64_to_id};

pub struct Invitation {
    pub code: ID,
    pub inviter_id: Option<i64>,
    pub invitee_email: String,
    pub words: String,
    pub is_used: bool,
}

impl InvitationFields for Invitation {
    fn field_code(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.code)
    }
    fn field_inviter(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, User, juniper_from_schema::Walked>,
    ) -> Fallible<Option<User>> {
        if let Some(inviter_id) = self.inviter_id {
            let user = find_user_by_id(&ex.context().get_pg_conn()?, inviter_id)?;
            Ok(Some(User {
                id: i64_to_id(inviter_id),
                user_name: user.name,
                energy: 0,
            }))
        } else {
            Ok(None)
        }
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
