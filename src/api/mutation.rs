use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;
use regex::RegexSet;
use rand::Rng;
use diesel::prelude::*;

use crate::db::{models as db_models, schema as db_schema};
use crate::custom_error::{Fallible, Error};
use crate::user::{email, signup, login, find_user_by_id, find_user_by_name};
use crate::forum;
use crate::party;
use crate::config::CONFIG;

use super::{id_to_i64, i64_to_id, Context, ContextTrait, Reply};
graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Mutation]);

pub struct Mutation;

impl MutationFields for Mutation {
    fn field_login(
        &self,
        ex: &juniper::Executor<'_, Context>,
        name: String,
        password: String,
    ) -> Fallible<bool> {
        match login(&ex.context().get_pg_conn()?, &name, &password) {
            Err(error) => Err(error),
            Ok(user) => {
                ex.context().remember_id(user.id)?;
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
        invitation_words: String,
    ) -> Fallible<bool> {
        match ex.context().get_id() {
            None => Err(Error::new_logic("尚未登入", 401)),
            Some(id) => {
                let conf = CONFIG.get();
                let set = RegexSet::new(conf.user.email_whitelist.clone()).unwrap();
                let matches = set.matches(&email);
                if !matches.matched_any() {
                    Err(Error::new_logic("不支援的信箱", 403))
                } else {
                    let conn = &ex.context().get_pg_conn()?;
                    let invite_code =
                        signup::create_invitation(&conn, Some(id), &email, &invitation_words)?;
                    email::send_invite_email(
                        &conn,
                        Some(id),
                        &invite_code,
                        &email,
                        &invitation_words,
                    )
                    .map(|_| true)
                    .map_err(|err| err)
                }
            }
        }
    }
    fn field_signup_by_invitation(
        &self,
        ex: &juniper::Executor<'_, Context>,
        code: String,
        name: String,
        password: String,
    ) -> Fallible<bool> {
        signup::create_user_by_invitation(&ex.context().get_pg_conn()?, &code, &name, &password)
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
    fn field_change_password(
        &self,
        ex: &juniper::Executor<'_, Context>,
        old_password: String,
        new_password: String,
    ) -> Fallible<bool> {
        match ex.context().get_id() {
            None => Err(Error::new_logic("尚未登入", 401)),
            Some(id) => {
                use db_schema::users;
                let user = find_user_by_id(&ex.context().get_pg_conn()?, id)?;
                let equal = argon2::verify_raw(
                    old_password.as_bytes(),
                    &user.salt,
                    &user.password_hashed,
                    &argon2::Config::default(),
                )?;
                match equal {
                    true => {
                        let salt = rand::thread_rng().gen::<[u8; 16]>();
                        let hash = argon2::hash_raw(
                            new_password.as_bytes(),
                            &salt,
                            &argon2::Config::default(),
                        )
                        .unwrap();
                        diesel::update(users::table.find(id))
                            .set(users::password_hashed.eq(hash))
                            .execute(&ex.context().get_pg_conn()?)?;
                        diesel::update(users::table.find(id))
                            .set(users::salt.eq(salt.to_vec()))
                            .execute(&ex.context().get_pg_conn()?)?;
                        Ok(true)
                    }
                    false => Err(Error::new_logic("密碼錯誤", 401)),
                }
            }
        }
    }
    fn field_forget_password(
        &self,
        ex: &juniper::Executor<'_, Context>,
        name: String,
    ) -> Fallible<bool> {
        let user = find_user_by_name(&ex.context().get_pg_conn()?, &name)?;
        use rand::distributions::Alphanumeric;
        let code: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .collect();
        let reset_password = db_models::NewResetPassword {
            code: &code,
            user_id: user.id,
        };
        diesel::insert_into(db_schema::reset_password::table)
            .values(&reset_password)
            .execute(&ex.context().get_pg_conn()?)?;
        email::send_reset_password_email(&code, &user.email)?;
        Ok(true)
    }
    fn field_reset_password(
        &self,
        ex: &juniper::Executor<'_, Context>,
        code: String,
        new_password: String,
    ) -> Fallible<bool> {
        use db_schema::{users, reset_password};
        let reset_password = reset_password::table
            .filter(reset_password::code.eq(code.to_owned()))
            .first::<db_models::ResetPassword>(&ex.context().get_pg_conn()?)
            .or(Err(Error::new_logic(format!("查無重設密碼代碼"), 404)))?;
        match reset_password.is_used {
            true => Err(Error::new_logic("代碼已用過", 403)),
            false => {
                let salt = rand::thread_rng().gen::<[u8; 16]>();
                let hash =
                    argon2::hash_raw(new_password.as_bytes(), &salt, &argon2::Config::default())
                        .unwrap();
                diesel::update(users::table.find(reset_password.user_id))
                    .set(users::password_hashed.eq(hash))
                    .execute(&ex.context().get_pg_conn()?)?;
                diesel::update(users::table.find(reset_password.user_id))
                    .set(users::salt.eq(salt.to_vec()))
                    .execute(&ex.context().get_pg_conn()?)?;
                diesel::update(
                    reset_password::table.filter(reset_password::code.eq(code.to_owned())),
                )
                .set(reset_password::is_used.eq(true))
                .execute(&ex.context().get_pg_conn()?)?;
                Ok(true)
            }
        }
    }
}
