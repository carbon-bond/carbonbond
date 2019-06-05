extern crate juniper;
extern crate serde_json;

use juniper::{FieldResult};
use juniper::http::graphiql::graphiql_source;
use juniper::http::GraphQLRequest;
use actix_web::{HttpRequest, HttpResponse, Result as ActixResult};
use actix_web::web;
use actix_session::{Session};

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
}

impl juniper::Context for Ctx {}

struct Query;

#[juniper::object(
    Context = Ctx,
)]
impl Query {
    fn me(context: &Ctx) -> FieldResult<Me> {
        match context.session.get::<String>("id")? {
            Some(id) => Ok(Me {
                id: Some("金剛".to_string()),
            }),
            None => Ok(Me { id: None }),
        }
    }
}

struct Mutation;

#[juniper::object(
    Context = Ctx,
)]
impl Mutation {
    fn login(context: &Ctx) -> FieldResult<Option<Error>> {
        context.session.set::<String>("id", "金剛".to_string())?;
        Ok(None)
    }
}

type Schema = juniper::RootNode<'static, Query, Mutation>;

pub fn api(gql: web::Json<GraphQLRequest>, session: Session) -> ActixResult<String> {
    let ctx = Ctx { session };
    let schema = Schema::new(Query, Mutation);
    let res = gql.execute(&schema, &ctx);
    Ok(serde_json::to_string(&res).unwrap())
}

pub fn graphiql(_req: HttpRequest) -> HttpResponse {
    let html = graphiql_source("http://localhost:8080/api");
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}
