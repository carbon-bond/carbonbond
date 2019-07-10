use juniper::{FieldResult};
use juniper::http::graphiql::graphiql_source;
use juniper::http::GraphQLRequest;
use actix_web::{HttpRequest, HttpResponse};
use actix_web::web;
use actix_session::{Session};
use diesel::prelude::*;

use crate::user::email;
use crate::user::signup;
use crate::user;
use crate::custom_error::Error;

use std::sync::{Arc, Mutex};

use crate::{Ctx, Context};
impl juniper::Context for Ctx {}

fn i64_to_id(id: i64) -> juniper::ID {
    juniper::ID::new(id.to_string())
}

#[derive(juniper::GraphQLObject)]
struct Me {
    id: Option<String>,
}

struct Party {
    id: juniper::ID,
}
#[juniper::object]
impl Party {
    fn id(&self) -> juniper::ID {
        self.id.clone()
    }
    fn name(&self) -> &str {
        // NOTE: 這裡是不是會發生 N+1 問題?
        "TODO: 去資料庫查找"
    }
}
struct Article {
    id: juniper::ID,
    name: String,
    board_id: juniper::ID,
    author_id: String,
}
#[juniper::object(Context = Ctx)]
impl Article {
    fn id(&self) -> juniper::ID {
        self.id.clone()
    }
    fn name(&self) -> &str {
        &self.name
    }
    fn author_id(&self) -> &str {
        &self.author_id
    }
    fn board_id(&self) -> juniper::ID {
        self.board_id.clone()
    }
}

#[derive(juniper::GraphQLObject)]
struct Category {
    id: juniper::ID,
    board_id: juniper::ID,
    def: String,
    is_active: bool,
    replacing: Option<juniper::ID>,
}

struct Board {
    id: juniper::ID,
    name: String,
    ruling_party_id: juniper::ID,
}

#[juniper::object(Context = Ctx)]
impl Board {
    fn id(&self) -> juniper::ID {
        self.id.clone()
    }
    fn name(&self) -> &str {
        &self.name
    }
    fn ruling_party(&self) -> Party {
        Party {
            id: self.ruling_party_id.clone(),
        }
    }
    fn parties(&self) -> Vec<Party> {
        vec![] // TODO: 抓出政黨
    }
    fn categories(&self, ctx: &Ctx) -> Vec<Category> {
        use crate::db::schema::categories::dsl::*;
        use crate::db::models;
        let results = categories
            .filter(board_id.eq(self.id.parse::<i64>().unwrap())) // TODO: 拋出錯誤
            .load::<models::Category>(&*ctx.get_pg_conn())
            .expect("取模板失敗");
        results
            .into_iter()
            .map(|t| Category {
                id: juniper::ID::new(t.id.to_string()),
                board_id: i64_to_id(t.board_id),
                def: t.def,
                is_active: t.is_active,
                replacing: match t.replacing {
                    Some(t) => Some(i64_to_id(t)),
                    None => None,
                },
            })
            .collect()
    }
}

struct Query;

#[juniper::object(
    Context = Ctx,
)]
impl Query {
    fn me(ctx: &Ctx) -> FieldResult<Me> {
        match ctx.session.get::<String>("id")? {
            None => Ok(Me { id: None }),
            Some(id) => {
                if id == "".to_string() {
                    Ok(Me { id: None })
                } else {
                    Ok(Me { id: Some(id) })
                }
            }
        }
    }
    fn board(ctx: &Ctx, name: String) -> FieldResult<Board> {
        use crate::db::schema::boards::dsl::*;
        use crate::db::models;
        let results = boards
            .filter(board_name.eq(&name))
            .load::<models::Board>(&*ctx.get_pg_conn())
            .expect("取看板失敗");
        if results.len() == 1 {
            let b = &results[0];
            Ok(Board {
                id: juniper::ID::new(b.id.to_string()),
                name: b.board_name.clone(),
                ruling_party_id: juniper::ID::new(b.ruling_party_id.to_string()),
            })
        } else {
            Error::LogicError("找不到看板", 404).to_field_result()
        }
    }
    fn boardList(ctx: &Ctx) -> FieldResult<Vec<Board>> {
        use crate::db::schema::boards::dsl::*;
        use crate::db::models;
        let board_vec = boards
            .load::<models::Board>(&*ctx.get_pg_conn())
            .or(Error::InternalError.to_field_result())?;
        Ok(board_vec
            .into_iter()
            .map(|b| Board {
                id: i64_to_id(b.id),
                name: b.board_name,
                ruling_party_id: i64_to_id(b.ruling_party_id),
            })
            .collect())
    }
    fn articleList(
        ctx: &Ctx,
        name: String,
        offset: i32,
        page_size: i32,
        show_hidden: Option<bool>,
    ) -> FieldResult<Vec<Article>> {
        unimplemented!();
    }
}

struct Mutation;

#[juniper::object(
    Context = Ctx,
)]
impl Mutation {
    fn login(ctx: &Ctx, id: String, password: String) -> FieldResult<bool> {
        match user::login(&ctx.get_pg_conn(), &id, &password) {
            Err(error) => error.to_field_result(),
            Ok(()) => {
                ctx.remember_id(id)?;
                Ok(true)
            }
        }
    }
    fn logout(ctx: &Ctx) -> FieldResult<bool> {
        ctx.forget_id()?;
        Ok(true)
    }
    fn invite_signup(ctx: &Ctx, email: String) -> FieldResult<bool> {
        match ctx.session.get::<String>("id")? {
            None => Error::LogicError("尚未登入", 401).to_field_result(),
            Some(id) => {
                // TODO: 寫宏來處理類似邏輯
                let invite_code =
                    match signup::create_invitation(&ctx.get_pg_conn(), Some(&id), &email) {
                        Err(error) => {
                            return error.to_field_result();
                        }
                        Ok(code) => code,
                    };
                match email::send_invite_email(Some(&id), &invite_code, &email) {
                    Err(error) => error.to_field_result(),
                    Ok(_) => Ok(true),
                }
            }
        }
    }
    fn signup_by_invitation(
        ctx: &Ctx,
        code: String,
        id: String,
        password: String,
    ) -> FieldResult<bool> {
        match signup::create_user_by_invitation(&ctx.get_pg_conn(), &code, &id, &password) {
            Err(error) => error.to_field_result(),
            Ok(_) => Ok(true),
        }
    }
    fn create_article(ctx: &Ctx) -> FieldResult<juniper::ID> {
        unimplemented!();
    }
}

type Schema = juniper::RootNode<'static, Query, Mutation>;

pub fn api(
    gql: web::Json<GraphQLRequest>,
    session: Session,
    conn: web::Data<Arc<Mutex<PgConnection>>>,
) -> HttpResponse {
    let ctx = Ctx {
        session,
        conn: (*conn).clone(),
    };
    let schema = Schema::new(Query, Mutation);
    let res = gql.execute(&schema, &ctx);
    HttpResponse::Ok()
        .content_type("application/json")
        .body(serde_json::to_string(&res).unwrap())
}

pub fn graphiql(_req: HttpRequest) -> HttpResponse {
    let html = graphiql_source("http://localhost:8080/api");
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}
