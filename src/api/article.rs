use juniper_from_schema::graphql_schema_from_file;
use juniper::ID;
use diesel::prelude::*;

use crate::db::{models as db_models, schema as db_schema};
use crate::custom_error::{Fallible, Error};
use crate::user::find_user_by_id;
use crate::forum;

use super::{id_to_i64, i64_to_id, Context, Category, Board, User};

graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Article]);

pub struct Article {
    pub id: ID,
    pub title: String,
    pub board_id: ID,
    pub author_id: ID,
    pub category_id: ID,
    pub energy: i32,
    pub create_time: i32,
    pub root_id: ID,
}

impl ArticleFields for Article {
    fn field_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.id)
    }
    fn field_title(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&String> {
        Ok(&self.title)
    }
    fn field_root_id(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&ID> {
        Ok(&self.root_id)
    }
    fn field_energy(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&i32> {
        Ok(&self.energy)
    }
    fn field_create_time(&self, _ex: &juniper::Executor<'_, Context>) -> Fallible<&i32> {
        Ok(&self.create_time)
    }
    fn field_author(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, User, juniper_from_schema::Walked>,
    ) -> Fallible<User> {
        let author_id = id_to_i64(&self.author_id)?;
        let user = find_user_by_id(&ex.context().get_pg_conn()?, author_id)?;
        Ok(User {
            user_name: user.name,
            energy: 0,
            id: self.author_id.clone(),
        })
    }
    fn field_category(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Category, juniper_from_schema::Walked>,
    ) -> Fallible<Category> {
        use db_schema::categories::dsl::*;
        let c = categories
            .filter(id.eq(id_to_i64(&self.category_id)?))
            .first::<db_models::Category>(&ex.context().get_pg_conn()?)
            .map_err(|_| Error::new_logic("找不到分類", 404))?;
        Ok(Category {
            id: i64_to_id(c.id),
            board_id: i64_to_id(c.board_id),
            body: c.body,
            is_active: c.is_active,
            replacing: c.replacing.map(|t| i64_to_id(t)),
        })
    }
    fn field_board(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Board, juniper_from_schema::Walked>,
    ) -> Fallible<Board> {
        use db_schema::boards::dsl::*;
        let b = boards
            .filter(id.eq(id_to_i64(&self.board_id)?))
            .first::<db_models::Board>(&ex.context().get_pg_conn()?)
            .map_err(|_| Error::new_logic("找不到看板", 404))?;
        Ok(Board {
            id: i64_to_id(b.id),
            detail: b.detail,
            title: b.title,
            board_name: b.board_name,
            ruling_party_id: i64_to_id(b.ruling_party_id),
        })
    }
    fn field_content(&self, ex: &juniper::Executor<'_, Context>) -> Fallible<Vec<String>> {
        let id = id_to_i64(&self.id)?;
        let c_id = id_to_i64(&self.category_id)?;
        forum::get_article_content(ex.context(), id, c_id).map_err(|err| err)
    }
    fn field_same_root_articles(
        &self,
        ex: &juniper::Executor<'_, Context>,
        _trail: &QueryTrail<'_, Article, juniper_from_schema::Walked>,
    ) -> Fallible<Vec<Article>> {
        let list = forum::get_articles_with_root(ex.context(), id_to_i64(&self.root_id)?)?;
        Ok(list
            .into_iter()
            .map(|(a, _c)| Article {
                id: i64_to_id(a.id),
                title: a.title,
                board_id: i64_to_id(a.board_id),
                author_id: i64_to_id(a.author_id),
                category_id: i64_to_id(a.category_id),
                create_time: a.create_time.timestamp() as i32,
                energy: 0,
                root_id: i64_to_id(a.root_id),
            })
            .collect())
    }
}
