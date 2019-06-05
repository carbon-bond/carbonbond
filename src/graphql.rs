extern crate juniper;
extern crate serde_json;

use juniper::{FieldResult, Variables, EmptyMutation};
use juniper::http::graphiql::graphiql_source;
use actix_web::{HttpRequest, HttpResponse, Result as ActixResult};

#[derive(juniper::GraphQLEnum, Clone, Copy)]
enum Episode {
    NewHope,
    Empire,
    Jedi,
}

struct Ctx(Episode);

impl juniper::Context for Ctx {}

struct Query;

#[juniper::object(
    Context = Ctx,
)]
impl Query {
    fn favoriteEpisode(context: &Ctx) -> FieldResult<Episode> {
        Ok(context.0)
    }
}

type Schema = juniper::RootNode<'static, Query, EmptyMutation<Ctx>>;

pub fn api(_req: &HttpRequest) -> ActixResult<String> {
    let ctx = Ctx(Episode::NewHope);

    let (res, _errors) = juniper::execute(
        "query { favoriteEpisode }",
        None,
        &Schema::new(Query, EmptyMutation::new()),
        &Variables::new(),
        &ctx,
    )
    .unwrap();

    Ok(serde_json::to_string(&res).unwrap())
}

pub fn graphiql(_req: &HttpRequest) -> HttpResponse {
    let html = graphiql_source("http://localhost:8080/api");
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}
