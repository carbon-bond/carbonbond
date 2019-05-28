use std::env;

use carbon_bond::db;

fn main() -> Result<(), String> {

    let args: Vec<String> = env::args().collect();
    if args.len() != 3 {
        return Err("用法： db-tool 名字 password".to_owned());
    }
    let db_conn = db::connect_db();
    db::create_user(&db_conn, &args[1], &args[2]);

    /*use db::schema::users::dsl::*;
    use diesel::prelude::*;
    use db::models::*;
    let results = users.filter(id.eq("石墨")).load::<User>(&db_conn).expect("取使用者失敗");
    for user in results {
        println!("{}", user.id);
        println!("{:?}", user.password_bytes);
    }*/
    return Ok(());
}