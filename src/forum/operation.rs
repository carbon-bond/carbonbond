use std::fs;

extern crate serde_json;
use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::MAX_ARTICLE_COLUMN;
use crate::db::{models, schema};
use crate::custom_error::{Error, Fallible};

use super::category_body;
pub use category_body::{CategoryBody, ColSchema, StringOrI32, ColType, AtomType};

/// 回傳剛創的板的 id
pub fn create_board(conn: &PgConnection, party_id: i64, name: &str) -> Fallible<i64> {
    let new_board = models::NewBoard {
        board_name: name,
        ruling_party_id: party_id,
        title: "TODO: 讓創板者自行填入",
        detail: "",
    };

    let txt = fs::read_to_string("config/default_category.json").expect("讀取默認分類失敗");
    let default_categories: Vec<CategoryBody> =
        serde_json::from_str(&txt).expect("解析默認分類失敗");

    let board: models::Board = diesel::insert_into(schema::boards::table)
        .values(&new_board)
        .get_result(conn)
        .or(Err(Error::new_internal("創建看板失敗")))?;

    create_category(conn, board.id, &default_categories)?;

    // 將執政黨加入該板
    diesel::update(schema::parties::table.filter(schema::parties::dsl::id.eq(party_id)))
        .set(schema::parties::dsl::board_id.eq(board.id))
        .execute(conn)
        .or(Err(Error::new_internal("修改政黨資料失敗")))?;

    Ok(board.id)
}

pub fn create_category(
    conn: &PgConnection,
    board_id: i64,
    categories: &Vec<CategoryBody>,
) -> Fallible<i64> {
    let new_categories: Vec<models::NewCategory> = categories
        .into_iter()
        .map(|t| models::NewCategory {
            board_id,
            body: t.to_string(),
            category_name: &t.name,
        })
        .collect();
    let c: models::Category = diesel::insert_into(schema::categories::table)
        .values(&new_categories)
        .get_result(conn)
        .or(Err(Error::new_internal("新增分類失敗")))?;
    Ok(c.id)
}

pub fn create_article(
    conn: &PgConnection,
    author_id: &str,
    board_id: i64,
    root_id: Option<i64>,
    category_id: i64,
    category: &CategoryBody,
    title: &str,
    content: Vec<StringOrI32>,
) -> Fallible<i64> {
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
        .or(Err(Error::new_internal("新增文章失敗")))?;

    if root_id.is_none() {
        use schema::articles::{id, root_id};
        diesel::update(schema::articles::table.filter(id.eq(article.id)))
            .set(root_id.eq(article.id))
            .execute(conn)
            .or(Err(Error::new_internal("修改文章根節點失敗")))?;
    }
    let mut str_content: Vec<String> = vec!["".to_owned(); MAX_ARTICLE_COLUMN];
    let mut int_content: Vec<i32> = vec![0; MAX_ARTICLE_COLUMN];
    for (i, c) in content.into_iter().enumerate() {
        match c {
            StringOrI32::I32(t) => int_content[i] = t,
            StringOrI32::Str(t) => str_content[i] = t,
        }
    }
    let new_content = models::NewArticleContent {
        article_id: article.id,
        str_content: str_content,
        int_content: int_content,
    };
    diesel::insert_into(schema::article_contents::table)
        .values(&new_content)
        .execute(conn)
        .map_err(|e| Error::new_internal(format!("{}", e)))?;
    Ok(article.id)
}

pub fn create_edges(conn: &PgConnection, article_id: i64, edges: &Vec<(i64, i16)>) -> Fallible<()> {
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
        .or(Err(Error::new_internal("新增連結失敗")))?;
    Ok(())
}

pub fn get_article_content(
    conn: &PgConnection,
    article_id: i64,
    category_id: i64,
) -> Fallible<Vec<String>> {
    use schema::categories::dsl as c_dsl;
    let category = c_dsl::categories
        .filter(c_dsl::id.eq(category_id))
        .first::<models::Category>(conn)
        .or(Err(Error::new_logic(
            format!("找不到分類: id={}", category_id),
            404,
        )))?;
    let c_body = CategoryBody::from_string(&category.body)?;
    use schema::article_contents::dsl as ac_dsl;
    let content = ac_dsl::article_contents
        .filter(ac_dsl::article_id.eq(article_id))
        .first::<models::ArticleContent>(conn)
        .or(Err(Error::new_logic(
            format!("找不到內文: article_id={}", article_id),
            404,
        )))?;
    let res_vec: Vec<String> = c_body
        .structure
        .into_iter()
        .enumerate()
        .map(|(i, col_struct)| match col_struct.col_type {
            ColType::Atom(AtomType::Int) => content.int_content[i].to_string(),
            ColType::Atom(AtomType::Rating(_)) => content.int_content[i].to_string(),
            ColType::Atom(AtomType::Text) => content.str_content[i].clone(),
            ColType::Atom(AtomType::Line) => content.str_content[i].clone(),
            ColType::Arr(_, _) => content.str_content[i].clone(),
        })
        .collect();
    Ok(res_vec)
}
