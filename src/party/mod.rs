use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;

/// 回傳剛創的政黨 id
pub fn create_party_with_board_name(
    conn: &PgConnection,
    board_name: Option<&str>,
    name: &str,
) -> Result<i64, Error> {
    match board_name {
        Some(b_name) => {
            use crate::db::schema::boards::dsl::*;
            let results = boards
                .filter(board_name.eq(b_name))
                .select(id)
                .first::<i64>(conn);
            match results {
                Err(_) => Err(Error::LogicError("無此看板".to_string(), 400)),
                Ok(board_id) => create_party(conn, Some(board_id), name),
            }
        }
        None => create_party(conn, None, name),
    }
}

/// 回傳剛創的政黨 id
pub fn create_party(conn: &PgConnection, board_id: Option<i64>, name: &str) -> Result<i64, Error> {
    let new_party = models::NewParty {
        party_name: name,
        board_id: board_id,
    };
    // TODO: 撞名檢查、看板是否存在
    let party: models::Party = diesel::insert_into(schema::parties::table)
        .values(&new_party)
        .get_result(conn)
        .expect("新增看板失敗");

    Ok(party.id)
}
