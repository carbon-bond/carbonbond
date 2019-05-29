use super::schema::invitations;
use super::schema::users;

#[derive(Queryable)]
pub struct User {
    pub id: String,
    pub email: String,
    pub invitation_credit: i32,
    pub password_bytes: Vec<u8>,
    pub salt: Vec<u8>,
}
#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser<'a> {
    pub id: &'a str,
    pub email: &'a str,
    pub password_bytes: Vec<u8>,
    pub salt: Vec<u8>,
}

#[derive(Queryable)]
pub struct Invitation {
    pub id: i32,
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
