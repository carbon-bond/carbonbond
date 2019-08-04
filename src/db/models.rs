use super::schema::*;
use chrono::{DateTime, offset::Utc};

#[derive(Queryable)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub energy: i32,
    pub invitation_credit: i32,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub name: &'a str,
    pub email: &'a str,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
}

#[derive(Queryable)]
pub struct Invitation {
    pub id: i64,
    pub code: String,
    pub email: String,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "invitations"]
pub struct NewInvitation<'a> {
    pub code: &'a str,
    pub email: &'a str,
}

#[derive(Queryable)]
pub struct Party {
    pub id: i64,
    pub board_id: Option<i64>,
    pub party_name: String,
    pub energy: i32,
    pub chairman_id: i64,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "parties"]
pub struct NewParty<'a> {
    pub board_id: Option<i64>,
    pub party_name: &'a str,
    pub chairman_id: i64,
}

#[derive(Queryable)]
pub struct Board {
    pub id: i64,
    pub board_name: String,
    pub title: String,
    pub detail: String,
    pub ruling_party_id: i64,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "boards"]
pub struct NewBoard<'a> {
    pub board_name: &'a str,
    pub title: &'a str,
    pub detail: &'a str,
    pub ruling_party_id: i64,
}

#[derive(Queryable)]
pub struct Category {
    pub id: i64,
    pub category_name: String,
    pub board_id: i64,
    pub body: String,
    pub is_active: bool,
    pub replacing: Option<i64>,
}

#[derive(Insertable)]
#[table_name = "categories"]
pub struct NewCategory<'a> {
    pub board_id: i64,
    pub category_name: &'a str,
    pub body: String,
}

#[derive(Queryable)]
pub struct Edge {
    pub id: i64,
    pub from_node: i64,
    pub to_node: i64,
    pub transfuse: i16,
}

#[derive(Insertable)]
#[table_name = "edges"]
pub struct NewEdge {
    pub from_node: i64,
    pub to_node: i64,
    pub transfuse: i16,
}

#[derive(Queryable, Debug)]
pub struct Article {
    pub id: i64,
    pub board_id: i64,
    pub root_id: i64,
    pub category_id: i64,
    pub title: String,
    pub author_id: i64,
    pub show_in_list: bool,
    pub create_time: DateTime<Utc>,
}

#[derive(Insertable)]
#[table_name = "articles"]
pub struct NewArticle<'a> {
    pub board_id: i64,
    pub root_id: i64,
    pub category_id: i64,
    pub author_id: i64,
    pub title: &'a str,
    pub show_in_list: bool,
}

#[derive(Queryable, Debug)]
pub struct ArticleContent {
    pub id: i64,
    pub article_id: i64,
    pub str_content: Vec<String>,
    pub int_content: Vec<i32>,
}

#[derive(Insertable)]
#[table_name = "article_contents"]
pub struct NewArticleContent {
    pub article_id: i64,
    pub str_content: Vec<String>,
    pub int_content: Vec<i32>,
}

#[derive(Queryable)]
pub struct PartyMember {
    pub id: i64,
    pub board_id: Option<i64>,
    pub position: i16,
    pub dedication_ratio: i16,
    pub party_id: i64,
    pub create_time: DateTime<Utc>,
    pub user_id: i64,
}

#[derive(Insertable)]
#[table_name = "party_members"]
pub struct NewPartyMember {
    pub board_id: Option<i64>,
    pub position: i16,
    pub dedication_ratio: i16,
    pub party_id: i64,
    pub user_id: i64,
}
