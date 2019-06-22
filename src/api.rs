use juniper::{Value, FieldResult, FieldError};
use juniper::http::graphiql::graphiql_source;
use juniper::http::GraphQLRequest;
use actix_web::{HttpRequest, HttpResponse};
use actix_web::web;
use actix_session::{Session};
use diesel::pg::PgConnection;
use std::sync::{Arc, Mutex};

use crate::email;
use crate::signup;
use crate::login;

#[derive(juniper::GraphQLObject)]
struct Me {
    id: Option<String>,
}

#[derive(juniper::GraphQLObject)]
struct Error {
    message: String,
}

struct Ctx {
    session: Session,
    conn: Arc<Mutex<PgConnection>>,
}

impl juniper::Context for Ctx {}

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
                    Ok(Me {
                        id: Some("金剛".to_string()),
                    })
                }
            }
        }
    }
}

struct Mutation;

#[juniper::object(
    Context = Ctx,
)]
impl Mutation {
    fn login(context: &Ctx, id: String, password: String) -> FieldResult<Option<Error>> {
        match login::login(&context.conn.lock().unwrap(), &id, &password) {
            Err(login::Error::InternalError) => {
                Err(FieldError::new("Internal Error", Value::null()))
            }
            Err(login::Error::LogicError(description)) => Ok(Some(Error {
                message: description,
            })),
            Ok(()) => {
                context.session.set::<String>("id", id.to_string())?;
                Ok(None)
            }
        }
    }
    fn logout(context: &Ctx) -> FieldResult<Option<Error>> {
        context.session.set::<String>("id", "".to_string())?;
        Ok(None)
    }
    fn invite_signup(context: &Ctx, email: String) -> FieldResult<Option<Error>> {
        match context.session.get::<String>("id")? {
            None => Ok(Some(Error {
                message: "尚未登入".to_string(),
            })),
            Some(id) => {
                // TODO: 寫宏來處理類似邏輯
                let invite_code = match signup::create_invitation(
                    &context.conn.lock().unwrap(),
                    Some(&id),
                    &email,
                ) {
                    Err(signup::Error::InternalError) => {
                        return Err(FieldError::new("Internal Error", Value::null()));
                    }
                    Err(signup::Error::LogicError(description)) => {
                        return Ok(Some(Error {
                            message: description,
                        }));
                    }
                    Ok(code) => code,
                };
                match email::send_invite_email(Some(&id), &invite_code, &email) {
                    Err(email::Error::InternalError) => {
                        return Err(FieldError::new("Internal Error", Value::null()));
                    }
                    Ok(_) => Ok(None),
                }
            }
        }
    }
    fn signup_by_invitation(
        context: &Ctx,
        code: String,
        id: String,
        password: String,
    ) -> FieldResult<Option<Error>> {
        match signup::create_user_by_invitation(
            &context.conn.lock().unwrap(),
            &code,
            &id,
            &password,
        ) {
            Err(signup::Error::InternalError) => {
                return Err(FieldError::new("Internal Error", Value::null()));
            }
            Err(signup::Error::LogicError(description)) => {
                return Ok(Some(Error {
                    message: description,
                }));
            }
            Ok(_) => Ok(None),
        }
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
