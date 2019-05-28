use super::schema::users;

#[derive(Queryable)]
pub struct User {
    pub id: String,
    pub recommend_credit: i32,
    pub password_bytes: Vec<u8>,
    pub salt: Vec<u8>,
}
#[derive(Insertable)]
#[table_name="users"]
pub struct NewUser<'a> {
    pub id: &'a str,
    pub password_bytes: Vec<u8>,
    pub salt: Vec<u8>,
}