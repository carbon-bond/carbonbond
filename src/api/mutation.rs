use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;

use crate::custom_error::{Fallible, Error};
use crate::user::{email, signup, login};
use crate::forum;
use crate::party;

use super::{id_to_i64, i64_to_id, Context, ContextTrait, Reply};
graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Mutation]);

pub struct Mutation;

impl MutationFields for Mutation {
    fn field_login(
        &self,
        ex: &juniper::Executor<'_, Context>,
        id: String,
        password: String,
    ) -> Fallible<bool> {
        match login(&ex.context().get_pg_conn()?, &id, &password) {
            Err(error) => Err(error),
            Ok(()) => {
                ex.context().remember_id(id)?;
                Ok(true)
            }
        }
    }
    fn field_logout(&self, ex: &juniper::Executor<'_, Context>) -> Fallible<bool> {
        ex.context().forget_id()?;
        Ok(true)
    }
    fn field_invite_signup(
        &self,
        ex: &juniper::Executor<'_, Context>,
        email: String,
    ) -> Fallible<bool> {
        match ex.context().get_id() {
            None => Err(Error::new_logic("尚未登入", 401)),
            Some(id) => {
                // TODO: 寫宏來處理類似邏輯
                let invite_code =
                    signup::create_invitation(&ex.context().get_pg_conn()?, Some(&id), &email)?;
                email::send_invite_email(Some(&id), &invite_code, &email)
                    .map(|_| true)
                    .map_err(|err| err)
            }
        }
    }
    fn field_signup_by_invitation(
        &self,
        ex: &juniper::Executor<'_, Context>,
        code: String,
        id: String,
        password: String,
    ) -> Fallible<bool> {
        signup::create_user_by_invitation(&ex.context().get_pg_conn()?, &code, &id, &password)
            .map(|_| true)
            .map_err(|err| err)
    }
    fn field_create_article(
        &self,
        ex: &juniper::Executor<'_, Context>,
        board_name: String,
        category_name: String,
        title: String,
        content: Vec<String>,
        reply_to: Vec<Reply>,
    ) -> Fallible<ID> {
        let reply_to: Fallible<Vec<(i64, i16)>> = reply_to
            .into_iter()
            .map(|e| id_to_i64(&e.article_id).map(|id| (id, e.transfuse as i16)))
            .collect();
        let id = forum::create_article(
            ex.context(),
            &board_name,
            &reply_to?,
            &category_name,
            &title,
            content,
        )?;
        Ok(i64_to_id(id))
    }
    fn field_create_party(
        &self,
        ex: &juniper::Executor<'_, Context>,
        party_name: String,
        board_name: Option<String>,
    ) -> Fallible<ID> {
        let board_name = board_name.as_ref().map(|s| &**s);
        let id = party::create_party(ex.context(), board_name, &party_name)?;
        Ok(i64_to_id(id))
    }
    fn field_create_board(
        &self,
        ex: &juniper::Executor<'_, Context>,
        board_name: String,
        party_name: String,
    ) -> Fallible<ID> {
        let id = forum::create_board(ex.context(), &party_name, &board_name)?;
        Ok(i64_to_id(id))
    }
}
