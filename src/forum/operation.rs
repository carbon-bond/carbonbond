use std::fs;

extern crate serde_json;
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;

use super::category_body;
pub use category_body::{CategoryBody, ColSchema};

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
        fs::read_to_string("config/default_category.json").expect("讀取默認模板失敗");
    let default_categories: Vec<CategoryBody> =
        serde_json::from_str(&txt).expect("解析默認模板失敗");

    create_category(conn, board.id, &default_categories)?;

    Ok(board.id)
}

pub fn create_category(
    conn: &PgConnection,
    board_id: i64,
    categories: &Vec<CategoryBody>,
) -> Result<(), Error> {
    let new_categories: Vec<models::NewCategory> = categories
        .into_iter()
        .map(|t| models::NewCategory {
            board_id,
            def: t.to_string(),
        })
        .collect();
    diesel::insert_into(schema::categories::table)
        .values(&new_categories)
        .execute(conn)
        .expect("新增文章分類失敗");
    Ok(())
}

pub fn create_article(
    conn: &PgConnection,
    author_id: &str,
    board_id: i64,
    root_id: Option<i64>,
    category_id: i64,
    category: &CategoryBody,
    title: &str,
) -> Result<i64, Error> {
    let new_article = models::NewArticle {
        board_id,
        category_id,
        author_id,
        title,
        category_name: &category.name,
        root_id: root_id.unwrap_or(0),
        show_in_list: category.show_in_list,
    };
    let article: models::Article = diesel::insert_into(schema::articles::table)
        .values(&new_article)
        .get_result(conn)
        .map_err(|_| Error::InternalError)?;

    if root_id.is_none() {
        use schema::articles::{id, root_id};
        diesel::update(schema::articles::table.filter(id.eq(article.id)))
            .set(root_id.eq(article.id))
            .execute(conn)
            .map_err(|_| Error::InternalError)?;
    }

    Ok(article.id)
}

pub fn create_edges(
    conn: &PgConnection,
    article_id: i64,
    edges: &Vec<(i64, i16)>,
) -> Result<(), Error> {
    let new_edges: Vec<models::NewEdge> = edges
        .iter()
        .map(|&(to_node, transfuse)| models::NewEdge {
            from_node: article_id,
            to_node,
            transfuse,
        })
        .collect();
    // TODO 輸能相關的資料庫操作
    diesel::insert_into(schema::edges::table)
        .values(&new_edges)
        .execute(conn)
        .expect("新增連結失敗");
    Ok(())
}

pub fn check_col_valid(_col_struct: &Vec<ColSchema>, _content: &Vec<String>) -> bool {
    unimplemented!()
}
