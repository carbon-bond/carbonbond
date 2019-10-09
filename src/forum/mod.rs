use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::{Error, Fallible, ErrorCode, DataType};
use crate::Context;
use crate::party;

mod category_body;
pub use category_body::{ColSchema, CategoryBody, StringOrI32};

pub mod operation;

/// 回傳剛創的板的 id
pub fn create_board<C: Context>(ctx: &C, party_name: &str, name: &str) -> Fallible<i64> {
    // TODO: 撞名檢查，權限檢查，等等
    let user_id = ctx.get_id().ok_or(Error::new_logic(ErrorCode::NeedLogin))?;
    ctx.use_pg_conn(|conn| {
        check_board_name_valid(&conn, name)?;
        let party = party::get_party_by_name(&conn, party_name)?;
        if party.board_id.is_some() {
            Err(Error::new_other("並非流亡政黨").into())
        } else {
            let position = party::get_member_position(&conn, user_id, party.id)?;
            if position != 3 {
                Err(Error::new_logic(ErrorCode::PermissionDenied).into())
            } else {
                operation::create_board(&conn, party.id, name)
            }
        }
    })
}

pub fn create_category<C: Context>(
    ctx: C,
    board_id: i64,
    category: &Vec<CategoryBody>,
) -> Fallible<i64> {
    // TODO: 權限檢查，等等
    ctx.use_pg_conn(|conn| operation::create_category(&conn, board_id, category))
}

pub fn create_article<C: Context>(
    ctx: &C,
    board_name: &str,
    reply_to: &Vec<(i64, i16)>,
    category_name: &str,
    title: &str,
    content: Vec<String>,
) -> Fallible<i64> {
    let author_id = ctx.get_id().ok_or(Error::new_logic(ErrorCode::NeedLogin))?;
    let (board, category) = ctx.use_pg_conn(|conn| -> Fallible<_> {
        let b = get_board_by_name(&conn, &board_name)?;
        let c = get_category(&conn, category_name, b.id)?;
        Ok((b, c))
    })?;
    let c_body = CategoryBody::from_string(&category.body)?;
    if !c_body.rootable && reply_to.len() == 0 {
        return Err(Error::new_other("分類不可為根").into());
    }
    let mut node_ids = Vec::<i64>::with_capacity(reply_to.len());
    for &(id, transfuse) in reply_to {
        if !c_body.transfusable && transfuse != 0 {
            return Err(Error::new_other("分類不可輸能").into());
        }
        node_ids.push(id);
    }
    let related_articles = get_articles_meta(ctx, &node_ids)?;
    let mut root_id: Option<i64> = None;
    for (article, category_of_article) in related_articles.iter() {
        if article.board_id != board.id {
            return Err(Error::new_other("不可回應他板文章").into());
        } else if root_id.is_none() {
            root_id = Some(article.root_id);
        } else if root_id.unwrap() != article.root_id {
            return Err(Error::new_other("不可回應不同主題文章").into());
        }

        if !c_body.can_attach_to(&category_of_article.category_name) {
            return Err(Error::new_other(format!(
                "分類`{}`不可回應分類`{}`",
                c_body.name, category_of_article.category_name
            ))
            .into());
        }
    }
    let content = parse_content(&c_body.structure, content)?;
    ctx.use_pg_conn(|conn| {
        let id = operation::create_article(
            &conn,
            author_id,
            board.id,
            root_id,
            category.id,
            &c_body,
            title,
            content,
        )?;
        // TODO 創造文章內容
        operation::create_edges(&conn, id, reply_to)?;
        Ok(id)
    })
}

pub fn get_articles_meta<C: Context>(
    ctx: &C,
    article_ids: &Vec<i64>,
) -> Fallible<Vec<(models::Article, models::Category)>> {
    // TODO: 檢查是否為隱板
    use crate::db::schema::{articles, categories};
    let pairs = ctx.use_pg_conn(|conn| {
        let ret = articles::table
            .filter(articles::id.eq_any(article_ids))
            .inner_join(categories::table.on(categories::id.eq(articles::category_id)))
            .load::<(models::Article, models::Category)>(&conn)?;
        Ok(ret)
    })?;
    if pairs.len() == article_ids.len() {
        Ok(pairs)
    } else {
        Err(Error::new_not_found(DataType::Article, article_ids).into())
    }
}

pub fn get_board_by_name(conn: &PgConnection, name: &str) -> Fallible<models::Board> {
    use schema::boards;
    boards::table
        .filter(boards::board_name.eq(&name))
        .first::<models::Board>(conn)
        .or(Err(Error::new_not_found(DataType::Board, name)).into())
}

pub fn get_category(
    conn: &PgConnection,
    category_name: &str,
    board_id: i64,
) -> Fallible<models::Category> {
    use schema::categories;
    categories::table
        .filter(categories::is_active.eq(true))
        .filter(categories::category_name.eq(category_name))
        .filter(categories::board_id.eq(board_id))
        .first::<models::Category>(conn)
        .or(Err(Error::new_not_found(DataType::Category, category_name)).into())
}

pub fn parse_content(
    col_struct: &Vec<ColSchema>,
    content: Vec<String>,
) -> Fallible<Vec<StringOrI32>> {
    if content.len() != col_struct.len() {
        Err(Error::new_other("文章結構長度不符合分類規範").into())
    } else {
        let mut res: Vec<StringOrI32> = vec![];
        for (i, c) in content.into_iter().enumerate() {
            res.push(col_struct[i].parse_content(c)?);
        }
        Ok(res)
    }
}

pub fn check_board_name_valid(conn: &PgConnection, name: &str) -> Fallible<()> {
    if name.len() == 0 {
        Err(Error::new_other("板名長度不可為零").into())
    } else if name.contains(' ') || name.contains('\n') || name.contains('"') || name.contains('\'')
    {
        // TODO: 更多不合法字元
        Err(Error::new_other("看板名帶有不合法字元").into())
    } else {
        if get_board_by_name(&conn, name).is_ok() {
            Err(Error::new_other("與其它看板重名").into())
        } else {
            Ok(())
        }
    }
}

pub fn get_article_content<C: Context>(
    ctx: &C,
    article_id: i64,
    category_id: i64,
) -> Fallible<Vec<String>> {
    // TODO: 權限檢查，避免隱板文章外洩
    ctx.use_pg_conn(|conn| operation::get_article_content(&conn, article_id, category_id))
}

pub fn get_articles_with_root<C: Context>(
    ctx: &C,
    root_id: i64,
) -> Fallible<Vec<(models::Article, models::Category)>> {
    // TODO: 權限檢查，避免隱板文章外洩
    use schema::{articles, categories};
    ctx.use_pg_conn(|conn| {
        articles::table
            .inner_join(categories::table.on(articles::category_id.eq(categories::id)))
            .filter(articles::root_id.eq(root_id))
            .load::<(models::Article, models::Category)>(&conn)
            .map_err(|e| e.into())
    })
}

pub fn get_articles_connecting<C: Context>(
    _ctx: &C,
    _article_id: i64,
    _find_ancestor: bool,
) -> Fallible<Vec<models::Article>> {
    // TODO: 權限檢查，避免隱板文章外洩

    unimplemented!();
}
