use std::fs;

extern crate serde_json;
use serde::{Serialize, Deserialize};
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;

#[derive(Deserialize, Serialize, Debug)]
pub struct Threshold {
    bond_energy: i32,
    identity: usize, // 0平民, 1黨員, 2黨代表, 3黨主席
}
#[derive(Deserialize, Serialize, Debug)]
pub struct NodeCol {
    col_name: String,
    col_type: String,
    restriction: String,
}
#[derive(Deserialize, Serialize, Debug)]
pub struct NodeTemplate {
    template_name: String,
    transfusable: bool,
    is_question: bool,
    show_in_list: bool,
    rootable: bool,
    threshold_to_post: Threshold,
    attached_to: Vec<String>,
    structure: Vec<NodeCol>,
}
impl NodeTemplate {
    pub fn to_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}

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
        fs::read_to_string("src/forum/default_template.json").expect("讀取默認模板失敗");
    let default_templates: Vec<NodeTemplate> =
        serde_json::from_str(&txt).expect("解析默認模板失敗");
    create_node_template(conn, board.id, &default_templates);

    Ok(board.id)
}

pub fn create_node_template(
    conn: &PgConnection,
    board_id: i64,
    templates: &Vec<NodeTemplate>,
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
    template_id: i64,
    article_name: String,
) -> Result<(), Error> {
    let new_article = models::NewArticle {
        board_id,
        template_id,
        author_id,
        article_name,
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
    transfuse: i32
) -> Result<(), Error> {
    let new_edge = models::NewEdge {
        from_node,
        to_node,
        transfuse
    };
    // TODO 輸能相關
    diesel::insert_into(schema::edges::table)
        .values(&new_edge)
        .execute(conn)
        .expect("新增連結失敗");
    Ok(())
}