use super::schema::*;

#[derive(Queryable)]
pub struct User {
    pub id: String,
    pub email: String,
    pub energy: i32,
    pub invitation_credit: i32,
    pub password_hashed: Vec<u8>,
    pub salt: Vec<u8>,
    pub create_time: std::time::SystemTime,
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
    pub energy: i32,
    pub chairman_id: String,
    pub create_time: std::time::SystemTime,
}

#[derive(Insertable)]
#[table_name = "parties"]
pub struct NewParty<'a> {
    pub board_id: Option<i64>,
    pub party_name: &'a str,
    pub chairman_id: &'a str,
}

#[derive(Queryable)]
pub struct Board {
    pub id: i64,
    pub board_name: String,
    pub ruling_party_id: i64,
    pub create_time: std::time::SystemTime,
}

#[derive(Insertable)]
#[table_name = "boards"]
pub struct NewBoard<'a> {
    pub board_name: &'a str,
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
    pub author_id: String,
    pub category_name: String,
    pub show_in_list: bool,
    pub create_time: std::time::SystemTime,
}

#[derive(Insertable)]
#[table_name = "articles"]
pub struct NewArticle<'a> {
    pub board_id: i64,
    pub root_id: i64,
    pub category_id: i64,
    pub category_name: &'a str,
    pub author_id: &'a str,
    pub title: &'a str,
    pub show_in_list: bool,
}

#[derive(Queryable)]
pub struct PartyMember {
    pub id: i64,
    pub board_id: Option<i64>,
    pub power: i16,
    pub dedication_ratio: i16,
    pub party_id: i64,
    pub create_time: std::time::SystemTime,
    pub user_id: String,
}
#[derive(Insertable)]
#[table_name = "party_members"]
pub struct NewPartyMember<'a> {
    pub board_id: Option<i64>,
    pub power: i16,
    pub dedication_ratio: i16,
    pub party_id: i64,
    pub user_id: &'a str,
}
