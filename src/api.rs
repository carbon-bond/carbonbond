use juniper::{Value, FieldResult, FieldError};
use juniper::http::graphiql::graphiql_source;
use juniper::http::GraphQLRequest;
use actix_web::{HttpRequest, HttpResponse};
use actix_web::web;
use actix_session::{Session};
use diesel::prelude::*;

use crate::user::email;
use crate::user::signup;
use crate::user::login;
use crate::custom_error;

use std::sync::{Arc, Mutex};

use crate::Ctx;
impl juniper::Context for Ctx {}

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

struct Board {
    id: juniper::ID,
    name: String,
    ruling_party_id: juniper::ID,
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
struct NodeTemplate {
    id: juniper::ID,
    board_id: juniper::ID,
    def: String,
    is_active: bool,
    replacing: Option<juniper::ID>,
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
        vec![]
    }
    fn node_templates(&self, context: &Ctx) -> Vec<NodeTemplate> {
        use crate::db::schema::node_templates::dsl::*;
        use crate::db::models;
        let conn = &*context.conn.lock().unwrap();
        let results = node_templates
            .filter(board_id.eq(self.id.parse::<i64>().unwrap())) // TODO: 拋出錯誤
            .load::<models::NodeTemplate>(conn)
            .expect("取模板失敗");
        results
            .into_iter()
            .map(|t| NodeTemplate {
                id: juniper::ID::new(t.id.to_string()),
                board_id: juniper::ID::new(t.board_id.to_string()),
                def: t.def,
                is_active: t.is_active,
                replacing: match t.replacing {
                    Some(t) => Some(juniper::ID::new(t.to_string())),
                    None => None,
                },
            })
            .collect()
    }
    fn articles(&self, context: &Ctx, show_in_list: Option<bool>) -> Vec<Article> {
        vec![]
    }
}

#[derive(juniper::GraphQLObject)]
struct Error {
    message: String,
}

struct Query;

#[juniper::object(
    Context = Ctx,
)]
impl Query {
    fn me(context: &Ctx) -> FieldResult<Me> {
        match context.session.get::<String>("id")? {
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
    fn board(context: &Ctx, name: String) -> FieldResult<Board> {
        use crate::db::schema::boards::dsl::*;
        use crate::db::models;
        let conn = &*context.conn.lock().unwrap();
        let results = boards
            .filter(board_name.eq(&name))
            .load::<models::Board>(conn)
            .expect("取看板失敗");
        if results.len() == 1 {
            let b = &results[0];
            Ok(Board {
                id: juniper::ID::new(b.id.to_string()),
                name: b.board_name.clone(),
                ruling_party_id: juniper::ID::new(b.ruling_party_id.to_string()),
            })
        } else {
            Err(custom_error::build_field_err("找不到看板", 404))
        }
    }
}

struct Mutation;

#[juniper::object(
    Context = Ctx,
)]
impl Mutation {
    fn login(context: &Ctx, id: String, password: String) -> FieldResult<bool> {
        match login::login(&context.conn.lock().unwrap(), &id, &password) {
            Err(error) => error.to_field_result(),
            Ok(()) => {
                context.session.set::<String>("id", id.to_string())?;
                Ok(true)
            }
        }
    }
    fn logout(context: &Ctx) -> FieldResult<bool> {
        context.session.set::<String>("id", "".to_string())?;
        Ok(true)
    }
    fn invite_signup(context: &Ctx, email: String) -> FieldResult<bool> {
        match context.session.get::<String>("id")? {
            None => Err(custom_error::build_field_err("尚未登入", 401)),
            Some(id) => {
                // TODO: 寫宏來處理類似邏輯
                let invite_code = match signup::create_invitation(
                    &context.conn.lock().unwrap(),
                    Some(&id),
                    &email,
                ) {
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
        context: &Ctx,
        code: String,
        id: String,
        password: String,
    ) -> FieldResult<bool> {
        match signup::create_user_by_invitation(
            &context.conn.lock().unwrap(),
            &code,
            &id,
            &password,
        ) {
            Err(error) => error.to_field_result(),
            Ok(_) => Ok(true),
        }
    }
    fn create_article(context: &Ctx) -> FieldResult<juniper::ID> {
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
