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
    author_id: &str,
    board_id: i64,
    edges: &Vec<(i64, i16)>,
    template_id: i64,
    title: &str,
) -> Result<(), Error> {
    let template = get_template(ctx, template_id)?;
    // TODO: 各項該做的檢查
    if !template.rootable && edges.len() == 0 {
        return Err(Error::LogicError("該分類不可為根", 403));
    }
    let mut node_ids = Vec::<i64>::with_capacity(edges.len());
    for &(id, transfuse) in edges {
        if !template.transfusable && transfuse != 0 {
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
        if !template.can_attach_to(&article.template_name) {
            return Err(Error::LogicError(
                "指定的兩個分類間不可建立關係",
                403,
            ));
        }
    }
    ctx.use_pg_conn(|conn| {
        let id = operation::create_article(
            conn,
            author_id,
            board_id,
            root_id,
            template_id,
            &template.template_name,
            title,
        )?;
        // TODO 創造文章內容
        operation::create_edges(conn, id, edges)
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

pub fn get_template<C: Context>(ctx: &C, template_id: i64) -> Result<TemplateBody, Error> {
    use crate::db::schema::node_templates::dsl::*;
    let str_body = ctx.use_pg_conn(|conn| {
        node_templates
            .filter(id.eq(template_id))
            .select(def)
            .first::<String>(conn)
            .map_err(|_| Error::LogicError("找不到模板", 404))
    })?;
    Ok(TemplateBody::from_string(&str_body))
}

pub fn check_col_valid(_col_struct: &Vec<NodeCol>, _content: &Vec<String>) -> bool {
    unimplemented!()
}
