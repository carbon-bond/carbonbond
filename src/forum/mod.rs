use std::fs;

extern crate serde_json;
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;

mod template;
pub use template::{NodeCol, Threshold, TemplateBody};

/// 回傳剛創的板的 id
pub fn create_board(conn: &PgConnection, party_id: i64, name: &str) -> Result<i64, Error> {
    let new_board = models::NewBoard {
        board_name: name,
        ruling_party_id: party_id,
    };
    // TODO: 撞名檢查
    let board: models::Board = diesel::insert_into(schema::boards::table)
        .values(&new_board)
        .get_result(conn)
        .expect("新增看板失敗");

    let txt =
        fs::read_to_string("config/default_templates.json").expect("讀取默認模板失敗");
    let default_templates: Vec<TemplateBody> =
        serde_json::from_str(&txt).expect("解析默認模板失敗");

    create_node_template(conn, board.id, &default_templates)?;

    Ok(board.id)
}

pub fn create_node_template(
    conn: &PgConnection,
    board_id: i64,
    templates: &Vec<TemplateBody>,
) -> Result<(), Error> {
    // TODO 撞名檢查
    let new_templates: Vec<models::NewNodeTemplate> = templates
        .into_iter()
        .map(|t| models::NewNodeTemplate {
            board_id,
            def: t.to_string(),
        })
        .collect();
    diesel::insert_into(schema::node_templates::table)
        .values(&new_templates)
        .execute(conn)
        .expect("新增文章分類失敗");
    Ok(())
}

pub fn create_article(
    conn: &PgConnection,
    author_id: String,
    board_id: i64,
    root_id: i64,
    template_id: i64,
    title: String,
) -> Result<(), Error> {
    let new_article = models::NewArticle {
        board_id,
        template_id,
        author_id,
        title,
        root_id,
    };
    diesel::insert_into(schema::articles::table)
        .values(&new_article)
        .execute(conn)
        .expect("新增文章失敗");
    Ok(())
}

pub fn create_edge(
    conn: &PgConnection,
    from_node: i64,
    to_node: i64,
    transfuse: i32,
) -> Result<(), Error> {
    let new_edge = models::NewEdge {
        from_node,
        to_node,
        transfuse,
    };
    // TODO 輸能相關
    diesel::insert_into(schema::edges::table)
        .values(&new_edge)
        .execute(conn)
        .expect("新增連結失敗");
    Ok(())
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
