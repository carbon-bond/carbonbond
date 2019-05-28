use diesel::prelude::*;
use diesel::pg::PgConnection;
use dotenv::dotenv;
use argon2rs;
use std::env;

pub mod schema;
pub mod models;
use models::{User, NewUser};

pub fn connect_db() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", database_url))
}

pub fn create_user<'a>(conn: &PgConnection,
    id: &'a str, password: &'a str
) -> models::User {
    use schema::users;
    //use rand::ThreadRng;
    use rand::Rng;
    let salt: String = rand::thread_rng().gen::<[char; 32]>()
        .into_iter().collect();
    let password_array = argon2rs::argon2i_simple(&password, &salt[..]);
    let new_user = NewUser {
        id, 
        password_bytes: password_array.iter().map(|ch| *ch as u8).collect(),
        salt: salt.chars().map(|ch| ch as u8).collect()
    };
    diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn)
        .expect("新增使用者失敗")
}