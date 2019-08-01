use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::{Error, Fallible};
use crate::Context;
use crate::party;

mod category_body;
pub use category_body::{ColSchema, CategoryBody, StringOrI32};

pub mod operation;

/// 回傳剛創的板的 id
pub fn create_board<C: Context>(ctx: &C, party_name: &str, name: &str) -> Fallible<i64> {
    // TODO: 撞名檢查，權限檢查，等等
    let user_id = ctx.get_id().ok_or(Error::new_logic("尚未登入", 401))?;
    ctx.use_pg_conn(|conn| {
        check_board_name_valid(&conn, name)?;
        let party = party::get_party_by_name(&conn, party_name)?;
        if party.board_id.is_some() {
            Err(Error::new_logic(format!("{} 並非流亡政黨", party_name), 403).into())
        } else {
            let position = party::get_member_position(&conn, &user_id, party.id)?;
            if position != 3 {
                Err(Error::new_logic("並非黨主席", 403).into())
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
    edges: &Vec<(i64, i16)>,
    category_name: &str,
    title: &str,
    content: Vec<String>,
) -> Fallible<i64> {
    let author_id = ctx.get_id().ok_or(Error::new_logic("尚未登入", 401))?;
    let (board, category) = ctx.use_pg_conn(|conn| -> Fallible<_> {
        let b = get_board_by_name(&conn, &board_name)?;
        let c = get_category(&conn, category_name, b.id)?;
        Ok((b, c))
    })?;
    let c_body = CategoryBody::from_string(&category.body)?;
    // TODO: 各項該做的檢查
    if !c_body.rootable && edges.len() == 0 {
        return Err(Error::new_logic(format!("分類不可為根: {}", category_name), 403).into());
    }
    let mut node_ids = Vec::<i64>::with_capacity(edges.len());
    for &(id, transfuse) in edges {
        if !c_body.transfusable && transfuse != 0 {
            return Err(Error::new_logic(format!("分類不可輸能: {}", category_name), 403).into());
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
            return Err(Error::new_logic("內部連結指向不同主題樹", 403).into());
        }
        if !c_body.can_attach_to(&article.category_name) {
            return Err(Error::new_logic(
                format!(
                    "分類 {} 與 {} 間不可建立關係",
                    category_name, article.category_name
                ),
                403,
            )
            .into());
        }
    }
    let content = parse_content(&c_body.structure, content)?;
    ctx.use_pg_conn(|conn| {
        let id = operation::create_article(
            &conn,
            &author_id,
            board.id,
            root_id,
            category.id,
            &c_body,
            title,
            content,
        )?;
        // TODO 創造文章內容
        operation::create_edges(&conn, id, edges)?;
        Ok(id)
    })
}

pub fn get_articles_meta<C: Context>(
    ctx: &C,
    article_ids: &Vec<i64>,
) -> Fallible<Vec<models::Article>> {
    // TODO: 檢查是否為隱板
    use crate::db::schema::articles::dsl::id;
    let articles = ctx.use_pg_conn(|conn| {
        schema::articles::table
            .filter(id.eq_any(article_ids))
            .load::<models::Article>(&conn)
    })?;
    if articles.len() == article_ids.len() {
        Ok(articles)
    } else {
        Err(Error::new_logic("找不到文章資料", 404).into())
    }
}

pub fn get_board_by_name(conn: &PgConnection, name: &str) -> Fallible<models::Board> {
    use schema::boards::dsl::*;
    boards
        .filter(board_name.eq(&name))
        .first::<models::Board>(conn)
        .or(Err(
            Error::new_logic(format!("找不到看板: {}", name), 404).into()
        ))
}

pub fn get_category(
    conn: &PgConnection,
    category_name: &str,
    board_id: i64,
) -> Fallible<models::Category> {
    use schema::categories::dsl;
    dsl::categories
        .filter(dsl::is_active.eq(true))
        .filter(dsl::category_name.eq(category_name))
        .filter(dsl::board_id.eq(board_id))
        .first::<models::Category>(conn)
        .or(Err(Error::new_logic(
            format!("找不到分類: {}", category_name),
            404,
        )
        .into()))
}

pub fn parse_content(
    col_struct: &Vec<ColSchema>,
    content: Vec<String>,
) -> Fallible<Vec<StringOrI32>> {
    if content.len() != col_struct.len() {
        Err(Error::new_logic("結構長度有誤", 403).into())
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
        Err(Error::new_logic("板名不可為空", 403).into())
    } else if name.contains(' ') || name.contains('\n') || name.contains('"') || name.contains('\'')
    {
        Err(Error::new_logic("板名帶有不合法字串", 403).into())
    } else {
        if get_board_by_name(&conn, name).is_ok() {
            Err(Error::new_logic("與其它看板重名", 403).into())
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
    ctx.use_pg_conn(|conn| operation::get_article_content(&conn, article_id, category_id))
}
