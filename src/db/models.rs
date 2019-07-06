use super::schema::invitations;
use super::schema::users;
use super::schema::boards;
use super::schema::parties;
use super::schema::node_templates;
use super::schema::edges;
use super::schema::articles;

#[derive(Queryable)]
pub struct User {
    pub id: String,
    pub email: String,
    pub invitation_credit: i32,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
}
#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub id: &'a str,
    pub email: &'a str,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
}

#[derive(Queryable)]
pub struct Invitation {
    pub id: i64,
    pub code: String,
    pub email: String,
    pub create_time: std::time::SystemTime,
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
}

#[derive(Insertable)]
#[table_name = "parties"]
pub struct NewParty<'a> {
    pub board_id: Option<i64>,
    pub party_name: &'a str,
}

#[derive(Queryable)]
pub struct Board {
    pub id: i64,
    pub board_name: String,
    pub ruling_party_id: i64,
}

#[derive(Insertable)]
#[table_name = "boards"]
pub struct NewBoard<'a> {
    pub board_name: &'a str,
    pub ruling_party_id: i64,
}

#[derive(Queryable)]
pub struct NodeTemplate {
    pub id: i64,
    pub board_id: i64,
    pub def: String,
    pub is_active: bool,
    pub replacing: Option<i64>,
}
#[derive(Insertable)]
#[table_name = "node_templates"]
pub struct NewNodeTemplate {
    pub board_id: i64,
    pub def: String,
}

#[derive(Queryable)]
pub struct Edge {
    pub id: i64,
    pub from_node: i64,
    pub to_node: i64,
    pub transfuse: i64,
}
#[derive(Insertable)]
#[table_name = "edges"]
pub struct NewEdge {
    pub from_node: i64,
    pub to_node: i64,
    pub transfuse: i32,
}

#[derive(Queryable)]
pub struct Article {
    pub id: i64,
    pub root_id: i64,
    pub board_id: i64,
    pub template_id: i64,
    pub author_id: String,
    pub title: String,
}
#[derive(Insertable)]
#[table_name = "articles"]
pub struct NewArticle {
    pub board_id: i64,
    pub root_id: i64,
    pub template_id: i64,
    pub author_id: String,
    pub title: String,
}
