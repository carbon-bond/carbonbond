extern crate juniper;
extern crate serde_json;

use juniper::{FieldResult, EmptyMutation};
use juniper::http::graphiql::graphiql_source;
use actix_web::{HttpRequest, HttpResponse, Result as ActixResult};
use actix_web::web;

#[derive(juniper::GraphQLEnum, Clone, Copy)]
enum Episode {
    NewHope,
    Empire,
    Jedi,
}

#[derive(juniper::GraphQLObject)]
struct Me {
    id: Option<String>,
}

struct Ctx(Episode);

impl juniper::Context for Ctx {}

struct Query;

#[juniper::object(
    Context = Ctx,
)]
impl Query {
    fn me(context: &Ctx) -> FieldResult<Me> {
        Ok(Me {
            id: Some("金剛".to_string()),
        })
    }
}

type Schema = juniper::RootNode<'static, Query, EmptyMutation<Ctx>>;

pub fn api(ql: web::Json<juniper::http::GraphQLRequest>) -> ActixResult<String> {
    let ctx = Ctx(Episode::NewHope);

    let schema = Schema::new(Query, EmptyMutation::new());

    let res = ql.execute(&schema, &ctx);

    Ok(serde_json::to_string(&res).unwrap())
}

pub fn graphiql(_req: HttpRequest) -> HttpResponse {
    let html = graphiql_source("http://localhost:8080/api");
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}
