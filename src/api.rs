use juniper::{FieldResult, ID};
use juniper::http::graphiql::graphiql_source;
use juniper::http::GraphQLRequest;
use actix_web::{HttpRequest, HttpResponse};
use actix_web::web;
use actix_session::{Session};
use diesel::prelude::*;

use crate::user::email;
use crate::user::signup;
use crate::user;
use crate::party;
use crate::custom_error::Error;
use crate::db::{models as db_models, schema as db_schema};
use crate::forum;

use std::sync::{Arc, Mutex};

use crate::{Ctx, Context};
impl juniper::Context for Ctx {}

fn i64_to_id(id: i64) -> ID {
    ID::new(id.to_string())
}
fn id_to_i64(id: &ID) -> i64 {
    id.parse::<i64>().unwrap()
}
fn systime_to_i32(time: std::time::SystemTime) -> i32 {
    time.duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i32
}

#[derive(juniper::GraphQLObject)]
struct Me {
    id: Option<String>,
}

struct Party {
    id: ID,
    party_name: String,
    board_id: Option<ID>,
    chairman_id: String,
    energy: i32,
}
#[juniper::object(Context = Ctx)]
impl Party {
    fn id(&self) -> ID {
        self.id.clone()
    }
    fn party_name(&self) -> String {
        self.party_name.clone()
    }
    fn board_id(&self) -> Option<ID> {
        self.board_id.clone()
    }
    fn chairman_id(&self) -> String {
        self.chairman_id.clone()
    }
    fn energy(&self) -> i32 {
        self.energy
    }
    fn position(&self, ctx: &Ctx, user_id: Option<String>) -> i32 {
        // TODO: 這裡有 N+1 問題
        let user_id = {
            if let Some(id) = user_id {
                id
            } else if let Some(id) = ctx.get_id() {
                id
            } else {
                return -1;
            }
        };
        let position =
            party::get_member_position(&*ctx.get_pg_conn(), &user_id, id_to_i64(&self.id));
        if let Ok(position) = position {
            position as i32
        } else {
            -1
        }
    }
    fn board(&self, ctx: &Ctx) -> Option<Board> {
        use db_schema::boards::dsl::*;
        if let Some(board_id) = self.board_id.clone() {
            let board = boards
                .filter(id.eq(id_to_i64(&board_id)))
                .first::<db_models::Board>(&*ctx.get_pg_conn())
                .ok();
            board.map(|b| Board {
                id: i64_to_id(b.id),
                detail: b.detail,
                title: b.title,
                board_name: b.board_name,
                ruling_party_id: i64_to_id(b.ruling_party_id),
            })
        } else {
            None
        }
    }
}

struct Article {
    id: ID,
    title: String,
    board_id: ID,
    author_id: String,
    category_name: String,
    category_id: ID,
    energy: i32,
    create_time: i32,
}
#[juniper::object(Context = Ctx)]
impl Article {
    fn id(&self) -> ID {
        self.id.clone()
    }
    fn title(&self) -> String {
        self.title.clone()
    }
    fn board_id(&self) -> ID {
        self.board_id.clone()
    }
    fn author_id(&self) -> String {
        self.author_id.clone()
    }
    fn category_name(&self) -> String {
        self.category_name.clone()
    }
    fn category_id(&self) -> ID {
        self.category_id.clone()
    }
    fn category(&self, ctx: &Ctx) -> FieldResult<Category> {
        use db_schema::categories::dsl::*;
        let c = categories
            .filter(id.eq(id_to_i64(&self.category_id)))
            .first::<db_models::Category>(&*ctx.get_pg_conn())
            .or(Error::new_logic("找不到分類", 404).to_field_result())?;
        Ok(Category {
            id: i64_to_id(c.id),
            board_id: i64_to_id(c.board_id),
            body: c.body,
            is_active: c.is_active,
            replacing: c.replacing.map(|t| i64_to_id(t)),
        })
    }
    fn energy(&self) -> i32 {
        self.energy
    }
    fn create_time(&self) -> i32 {
        self.create_time
    }
    fn board(&self, ctx: &Ctx) -> FieldResult<Board> {
        use db_schema::boards::dsl::*;
        let b = boards
            .filter(id.eq(id_to_i64(&self.board_id)))
            .first::<db_models::Board>(&*ctx.get_pg_conn())
            .or(Error::new_logic("找不到看板", 404).to_field_result())?;
        Ok(Board {
            id: i64_to_id(b.id),
            detail: b.detail,
            title: b.title,
            board_name: b.board_name,
            ruling_party_id: i64_to_id(b.ruling_party_id),
        })
    }
    fn content(&self, ctx: &Ctx) -> FieldResult<Vec<String>> {
        let id = id_to_i64(&self.id);
        let c_id = id_to_i64(&self.category_id);
        forum::get_article_content(ctx, id, c_id).map_err(|e| e.to_field_err())
    }
}

#[derive(juniper::GraphQLObject)]
struct Category {
    id: ID,
    board_id: ID,
    body: String,
    is_active: bool,
    replacing: Option<ID>,
}

struct Board {
    id: ID,
    board_name: String,
    ruling_party_id: ID,
    title: String,
    detail: String,
}

#[juniper::object(Context = Ctx)]
impl Board {
    fn id(&self) -> ID {
        self.id.clone()
    }
    fn board_name(&self) -> &str {
        &self.board_name
    }
    fn title(&self) -> &str {
        &self.title
    }
    fn detail(&self) -> &str {
        &self.detail
    }
    fn ruling_party_id(&self) -> ID {
        self.ruling_party_id.clone()
    }
    fn parties(&self) -> Vec<Party> {
        vec![] // TODO: 抓出政黨
    }
    fn categories(&self, ctx: &Ctx) -> FieldResult<Vec<Category>> {
        use db_schema::categories::dsl::*;
        let results = categories
            .filter(board_id.eq(id_to_i64(&self.id)))
            .load::<db_models::Category>(&*ctx.get_pg_conn())
            .or(Error::new_internal("查找分類列表失敗").to_field_result())?;
        Ok(results
            .into_iter()
            .map(|t| Category {
                id: ID::new(t.id.to_string()),
                board_id: i64_to_id(t.board_id),
                body: t.body,
                is_active: t.is_active,
                replacing: t.replacing.map(|t| i64_to_id(t)),
            })
            .collect())
    }
    fn article_count(&self, ctx: &Ctx, show_hidden: Option<bool>) -> FieldResult<i32> {
        use db_schema::articles::dsl;
        let show_hidden = show_hidden.unwrap_or(false);
        let mut query = dsl::articles.into_boxed();
        if !show_hidden {
            query = query.filter(dsl::show_in_list.eq(true));
        }
        let count = query
            .filter(dsl::board_id.eq(id_to_i64(&self.id)))
            .count()
            .get_result::<i64>(&*ctx.get_pg_conn())
            .or(Error::new_internal("查詢文章數失敗").to_field_result())?;
        Ok(count as i32)
    }
}

struct Query;

#[juniper::object(
    Context = Ctx,
)]
impl Query {
    fn me(ctx: &Ctx) -> FieldResult<Me> {
        match ctx.session.get::<String>("id")? {
            None => Ok(Me { id: None }),
            Some(id) => {
                if id == "".to_string() {
                    Ok(Me { id: None })
                } else {
                    Ok(Me { id: Some(id) })
                }
            }
        }
    }
    fn board(ctx: &Ctx, name: String) -> FieldResult<Board> {
        let board = forum::get_board_by_name(ctx, &name).map_err(|e| e.to_field_err())?;
        Ok(Board {
            id: i64_to_id(board.id),
            board_name: board.board_name,
            title: board.title,
            detail: board.detail,
            ruling_party_id: i64_to_id(board.ruling_party_id),
        })
    }
    fn article(ctx: &Ctx, id: ID) -> FieldResult<Article> {
        use db_schema::articles::dsl;
        let article = dsl::articles
            .filter(dsl::id.eq(id_to_i64(&id)))
            .first::<db_models::Article>(&*ctx.get_pg_conn())
            .or(Error::new_logic("找不到文章", 404).to_field_result())?;
        Ok(Article {
            id: i64_to_id(article.id),
            title: article.title,
            board_id: i64_to_id(article.board_id),
            author_id: article.author_id,
            category_name: article.category_name,
            category_id: i64_to_id(article.category_id),
            create_time: systime_to_i32(article.create_time),
            energy: 0,
        })
    }
    fn board_list(ctx: &Ctx, ids: Option<Vec<ID>>) -> FieldResult<Vec<Board>> {
        use db_schema::boards::dsl::*;
        let mut query = boards.into_boxed();
        if let Some(ids) = ids {
            let ids: Vec<i64> = ids.iter().map(|t| id_to_i64(t)).collect();
            query = query.filter(id.eq_any(ids));
        }
        let board_vec = query
            .load::<db_models::Board>(&*ctx.get_pg_conn())
            .or(Error::new_internal("查找看板列表失敗").to_field_result())?;
        Ok(board_vec
            .into_iter()
            .map(|b| Board {
                id: i64_to_id(b.id),
                board_name: b.board_name,
                title: b.title,
                detail: b.detail,
                ruling_party_id: i64_to_id(b.ruling_party_id),
            })
            .collect())
    }
    fn article_list(
        ctx: &Ctx,
        board_name: String,
        offset: i32,
        page_size: i32,
        show_hidden: Option<bool>,
    ) -> FieldResult<Vec<Article>> {
        use db_schema::articles::dsl;
        let show_hidden = show_hidden.unwrap_or(false);
        let board = forum::get_board_by_name(ctx, &board_name).map_err(|e| e.to_field_err())?;

        let mut query = dsl::articles
            .filter(dsl::board_id.eq(board.id))
            .into_boxed();
        if !show_hidden {
            query = query.filter(dsl::show_in_list.eq(true));
        }

        let article_vec = query
            .order(dsl::create_time.asc())
            .offset(offset as i64)
            .limit(page_size as i64)
            .load::<db_models::Article>(&*ctx.get_pg_conn())
            .or(Error::new_internal("查找文章列表失敗").to_field_result())?;

        Ok(article_vec
            .into_iter()
            .map(|a| Article {
                id: i64_to_id(a.id),
                title: a.title.clone(),
                board_id: i64_to_id(a.board_id),
                author_id: a.author_id.clone(),
                category_id: i64_to_id(a.category_id),
                category_name: a.category_name,
                create_time: systime_to_i32(a.create_time),
                energy: 0, // TODO: 鍵能
            })
            .collect())
    }
    fn party(ctx: &Ctx, party_name: String) -> FieldResult<Party> {
        let party = party::get_party_by_name(&*ctx.get_pg_conn(), &party_name)
            .map_err(|e| e.to_field_err())?;
        Ok(Party {
            id: i64_to_id(party.id),
            party_name: party.party_name,
            board_id: party.board_id.map(|id| i64_to_id(id)),
            chairman_id: party.chairman_id,
            energy: party.energy,
        })
    }
    fn my_party_list(ctx: &Ctx, board_name: Option<String>) -> FieldResult<Vec<Party>> {
        let user_id = ctx
            .get_id()
            .ok_or(Error::new_logic("尚未登入", 401).to_field_err())?;

        // TODO 用 join?
        use db_schema::party_members;
        let party_ids = party_members::table
            .filter(party_members::dsl::user_id.eq(user_id))
            .select(party_members::dsl::party_id)
            .load::<i64>(&*ctx.get_pg_conn())
            .or(Err(Error::new_internal("讀取政黨成員關係失敗")))?;

        use db_schema::parties::dsl;
        let mut query = dsl::parties.into_boxed();
        if let Some(board_name) = board_name {
            let board = forum::get_board_by_name(ctx, &board_name).map_err(|e| e.to_field_err())?;
            query = query.filter(dsl::board_id.eq(board.id));
        }

        let party_vec = query
            .filter(dsl::id.eq_any(party_ids))
            .load::<db_models::Party>(&*ctx.get_pg_conn())
            .or(Error::new_internal("讀取政黨列表失敗").to_field_result())?;
        Ok(party_vec
            .into_iter()
            .map(|p| Party {
                id: i64_to_id(p.id),
                party_name: p.party_name,
                board_id: p.board_id.map(|id| i64_to_id(id)),
                chairman_id: p.chairman_id,
                energy: p.energy,
            })
            .collect())
    }
    fn check_board_name_valid(ctx: &Ctx, name: String) -> Option<String> {
        forum::check_board_name_valid(ctx, &name)
            .err()
            .map(|err| err.get_msg().to_owned())
    }
    fn check_party_name_valid(ctx: &Ctx, name: String) -> Option<String> {
        party::check_party_name_valid(&*ctx.get_pg_conn(), &name)
            .err()
            .map(|err| err.get_msg().to_owned())
    }
    fn check_article_content_valid(
        ctx: &Ctx,
        content: Vec<String>,
        board_name: String,
        category_name: String,
    ) -> FieldResult<Vec<Option<String>>> {
        // TODO: 想辦法快取住分類
        let board = forum::get_board_by_name(ctx, &board_name).map_err(|e| e.to_field_err())?;
        let category =
            forum::get_category(ctx, &category_name, board.id).map_err(|e| e.to_field_err())?;
        let c_body = forum::CategoryBody::from_string(&category.body).unwrap();
        if c_body.structure.len() != content.len() {
            Error::new_logic("結構長度有誤", 403).to_field_result()
        } else {
            Ok(content
                .into_iter()
                .enumerate()
                .map(|(i, c)| {
                    c_body.structure[i]
                        .parse_content(c)
                        .err()
                        .map(|e| e.get_msg().to_owned())
                })
                .collect())
        }
    }
}

struct Mutation;

#[juniper::object(
    Context = Ctx,
)]
impl Mutation {
    fn login(ctx: &Ctx, id: String, password: String) -> FieldResult<bool> {
        match user::login(&ctx.get_pg_conn(), &id, &password) {
            Err(error) => error.to_field_result(),
            Ok(()) => {
                ctx.remember_id(id)?;
                Ok(true)
            }
        }
    }
    fn logout(ctx: &Ctx) -> FieldResult<bool> {
        ctx.forget_id()?;
        Ok(true)
    }
    fn invite_signup(ctx: &Ctx, email: String) -> FieldResult<bool> {
        match ctx.session.get::<String>("id")? {
            None => Error::new_logic("尚未登入", 401).to_field_result(),
            Some(id) => {
                // TODO: 寫宏來處理類似邏輯
                let invite_code =
                    match signup::create_invitation(&ctx.get_pg_conn(), Some(&id), &email) {
                        Err(error) => {
                            return error.to_field_result();
                        }
                        Ok(code) => code,
                    };
                match email::send_invite_email(Some(&id), &invite_code, &email) {
                    Err(error) => error.to_field_result(),
                    Ok(_) => Ok(true),
                }
            }
        }
    }
    fn signup_by_invitation(
        ctx: &Ctx,
        code: String,
        id: String,
        password: String,
    ) -> FieldResult<bool> {
        match signup::create_user_by_invitation(&ctx.get_pg_conn(), &code, &id, &password) {
            Err(error) => error.to_field_result(),
            Ok(_) => Ok(true),
        }
    }
    fn create_article(
        ctx: &Ctx,
        board_name: String,
        category_name: String,
        title: String,
        content: Vec<String>,
    ) -> FieldResult<ID> {
        // TODO: 還缺乏 edge 和 content
        let id = forum::create_article(ctx, &board_name, &vec![], &category_name, &title, content)
            .map_err(|e| e.to_field_err())?;
        Ok(i64_to_id(id))
    }
    fn create_party(ctx: &Ctx, party_name: String, board_name: Option<String>) -> FieldResult<ID> {
        let board_name = board_name.as_ref().map(|s| &**s);
        let id = party::create_party(ctx, board_name, &party_name).map_err(|e| e.to_field_err())?;
        Ok(i64_to_id(id))
    }
    fn create_board(ctx: &Ctx, board_name: String, party_name: String) -> FieldResult<ID> {
        let id =
            forum::create_board(ctx, &party_name, &board_name).map_err(|e| e.to_field_err())?;
        Ok(i64_to_id(id))
    }
}

type Schema = juniper::RootNode<'static, Query, Mutation>;

pub fn api(
    gql: web::Json<GraphQLRequest>,
    session: Session,
    conn: web::Data<Arc<Mutex<PgConnection>>>,
) -> HttpResponse {
    let ctx = Ctx {
        session,
        conn: (*conn).clone(),
    };
    let schema = Schema::new(Query, Mutation);
    let res = gql.execute(&schema, &ctx);
    HttpResponse::Ok()
        .content_type("application/json")
        .body(serde_json::to_string(&res).unwrap())
}

pub fn graphiql(_req: HttpRequest) -> HttpResponse {
    let html = graphiql_source("http://localhost:8080/api");
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}
