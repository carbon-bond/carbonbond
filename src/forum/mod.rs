use std::fs;

extern crate serde_json;
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;
use crate::Context;

mod template;
pub use template::{NodeCol, Threshold, TemplateBody};

pub mod operation;

/// 回傳剛創的板的 id
pub fn create_board<C: Context>(ctx: &C, party_id: i64, name: &str) -> Result<i64, Error> {
    // TODO: 撞名檢查，權限檢查，等等
    ctx.use_pg_conn(|conn| operation::create_board(conn, party_id, name))
}

pub fn create_node_template<C: Context>(
    ctx: C,
    board_id: i64,
    templates: &Vec<TemplateBody>,
) -> Result<(), Error> {
    // TODO: 權限檢查，等等
    ctx.use_pg_conn(|conn| operation::create_node_template(conn, board_id, templates))
}

pub fn create_article<C: Context>(
    ctx: &C,
    author_id: String,
    board_id: i64,
    root_id: i64,
    template_id: i64,
    title: String,
) -> Result<(), Error> {
    ctx.use_pg_conn(|conn| {
        operation::create_article(
            conn,
            author_id.clone(),
            board_id,
            root_id,
            template_id,
            title.clone(),
        )
    })
}

pub fn create_edge<C: Context>(
    ctx: &C,
    from_node: i64,
    to_node: i64,
    transfuse: i32,
) -> Result<(), Error> {
    // TODO: 權限檢查，等等
    ctx.use_pg_conn(|conn| operation::create_edge(conn, from_node, to_node, transfuse))
}

pub fn get_template(conn: &PgConnection, template_id: i64) -> TemplateBody {
    use crate::db::schema::node_templates::dsl::*;
    let results = node_templates
        .filter(id.eq(template_id))
        .load::<models::NodeTemplate>(conn)
        .expect("取模板失敗")
        .pop()
        .unwrap();
    serde_json::from_str(&results.def).expect("解析模板失敗")
}

pub fn check_col_valid(_col_struct: &Vec<NodeCol>, _content: &Vec<String>) -> bool {
    unimplemented!()
}
