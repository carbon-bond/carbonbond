use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;
use crate::Context;

/// 回傳剛創的政黨 id
pub fn create_party_with_board_name<C: Context>(
    ctx: &C,
    board_name: Option<&str>,
    name: &str,
) -> Result<i64, Error> {
    let user_id = {
        let id = ctx.get_id();
        if id.is_none() {
            return Err(Error::LogicError("尚未登入", 403));
        }
        id.unwrap()
    };
    ctx.use_pg_conn(|conn| match board_name {
        Some(b_name) => {
            use crate::db::schema::boards::dsl::*;
            let results = boards
                .filter(board_name.eq(b_name))
                .select(id)
                .first::<i64>(conn);
            match results {
                Err(_) => Err(Error::LogicError("無此看板", 400)),
                Ok(board_id) => create_party(conn, &user_id, Some(board_id), name),
            }
        }
        None => create_party(conn, &user_id, None, name),
    })
}

/// 回傳剛創的政黨 id
fn create_party(
    conn: &PgConnection,
    user_id: &str,
    board_id: Option<i64>,
    name: &str,
) -> Result<i64, Error> {
    // TODO: 撞名檢查，鍵能之類的檢查
    let new_party = models::NewParty {
        party_name: name,
        board_id: board_id,
    };
    let party: models::Party = diesel::insert_into(schema::parties::table)
        .values(&new_party)
        .get_result(conn)
        .expect("新增政黨失敗");

    // 把自己加進去當主席
    add_party_member(conn, user_id, party.id, 3)?;

    Ok(party.id)
}

fn add_party_member(
    conn: &PgConnection,
    user_id: &str,
    party_id: i64,
    power: i16,
) -> Result<(), Error> {
    let new_member = models::NewPartyMember {
        power,
        user_id,
        party_id,
        dedication_ratio: 10,
        board_id: None,
    };
    diesel::insert_into(schema::party_members::table)
        .values(&new_member)
        .execute(conn)
        .expect("新增黨員失敗");
    Ok(())
}
