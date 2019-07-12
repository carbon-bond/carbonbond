use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;
use crate::Context;

mod category_body;
pub use category_body::{ColSchema, CategoryBody};

pub mod operation;

/// 回傳剛創的板的 id
pub fn create_board<C: Context>(ctx: &C, party_id: i64, name: &str) -> Result<i64, Error> {
    // TODO: 撞名檢查，權限檢查，等等
    ctx.use_pg_conn(|conn| operation::create_board(conn, party_id, name))
}

pub fn create_category<C: Context>(
    ctx: C,
    board_id: i64,
    category: &Vec<CategoryBody>,
) -> Result<(), Error> {
    // TODO: 權限檢查，等等
    ctx.use_pg_conn(|conn| operation::create_category(conn, board_id, category))
}

pub fn create_article<C: Context>(
    ctx: &C,
    board_name: &str,
    edges: &Vec<(i64, i16)>,
    category_name: &str,
    title: &str,
) -> Result<i64, Error> {
    let author_id = ctx.get_id().ok_or(Error::LogicError("尚未登入", 401))?;
    let board =
        get_board_by_name(ctx, &board_name).or(Err(Error::LogicError("無此看板", 404)))?;
    let category = get_category(ctx, category_name, board.id)?;
    let c_body = CategoryBody::from_string(&category.body);
    // TODO: 各項該做的檢查
    if !c_body.rootable && edges.len() == 0 {
        return Err(Error::LogicError("該分類不可為根", 403));
    }
    let mut node_ids = Vec::<i64>::with_capacity(edges.len());
    for &(id, transfuse) in edges {
        if !c_body.transfusable && transfuse != 0 {
            return Err(Error::LogicError("該分類不可輸能", 403));
        }
        node_ids.push(id);
    }
    let node_ids: Vec<i64> = edges.iter().map(|(id, _)| *id).collect();
    let related_articles = get_articles_meta(ctx, &node_ids)?;
    let mut root_id: Option<i64> = None;
    for article in related_articles.iter() {
        if root_id.is_none() {
            root_id = Some(article.root_id);
        } else if root_id.unwrap() != article.root_id {
            return Err(Error::LogicError("內部連結指向不同主題樹", 403));
        }
        if !c_body.can_attach_to(&article.category_name) {
            return Err(Error::LogicError(
                "指定的兩個分類間不可建立關係",
                403,
            ));
        }
    }
    ctx.use_pg_conn(|conn| {
        let id = operation::create_article(
            conn,
            &author_id,
            board.id,
            root_id,
            category.id,
            &c_body,
            title,
        )?;
        // TODO 創造文章內容
        operation::create_edges(conn, id, edges)?;
        Ok(id)
    })
}

pub fn get_articles_meta<C: Context>(
    ctx: &C,
    article_ids: &Vec<i64>,
) -> Result<Vec<models::Article>, Error> {
    // TODO: 檢查是否為隱板
    use crate::db::schema::articles::dsl::id;
    let articles = ctx.use_pg_conn(|conn| {
        schema::articles::table
            .filter(id.eq_any(article_ids))
            .load::<models::Article>(conn)
            .map_err(|_| Error::InternalError)
    })?;
    if articles.len() == article_ids.len() {
        Ok(articles)
    } else {
        Err(Error::LogicError("找不到文章資料", 404))
    }
}

pub fn get_board_by_name<C: Context>(ctx: &C, name: &str) -> Result<models::Board, Error> {
    use schema::boards::dsl::*;
    ctx.use_pg_conn(|conn| {
        boards
            .filter(board_name.eq(&name))
            .first::<models::Board>(conn)
            .or(Err(Error::LogicError("找不到看板", 404)))
    })
}

pub fn get_category<C: Context>(
    ctx: &C,
    category_name: &str,
    board_id: i64,
) -> Result<models::Category, Error> {
    use schema::categories::dsl;
    ctx.use_pg_conn(|conn| {
        dsl::categories
            .filter(dsl::is_active.eq(true))
            .filter(dsl::category_name.eq(category_name))
            .filter(dsl::board_id.eq(board_id))
            .first::<models::Category>(conn)
            .map_err(|_| Error::LogicError("找不到分類", 404))
    })
}

pub fn check_col_valid(_col_struct: &Vec<ColSchema>, _content: &Vec<String>) -> bool {
    // TODO
    true
}
