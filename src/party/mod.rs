use diesel::pg::PgConnection;
use diesel::prelude::*;

use crate::db::{models, schema};
use crate::custom_error::Error;
use crate::Context;

/// 回傳剛創的政黨 id
pub fn create_party<C: Context>(
    ctx: &C,
    board_name: Option<&str>,
    name: &str,
) -> Result<i64, Error> {
    // TODO: 鍵能之類的檢查
    let user_id = ctx.get_id().ok_or(Error::LogicError("尚未登入", 401))?;
    ctx.use_pg_conn(|conn| {
        if get_party_by_name(conn, name).is_ok() {
            return Err(Error::LogicError("與其它政黨重名", 403));
        }
        match board_name {
            Some(b_name) => {
                use crate::db::schema::boards::dsl::*;
                let results = boards
                    .filter(board_name.eq(b_name))
                    .select(id)
                    .first::<i64>(conn);
                match results {
                    Err(_) => Err(Error::LogicError("無此看板", 404)),
                    Ok(board_id) => create_party_db(conn, &user_id, Some(board_id), name),
                }
            }
            None => create_party_db(conn, &user_id, None, name),
        }
    })
}

/// 回傳剛創的政黨 id
fn create_party_db(
    conn: &PgConnection,
    user_id: &str,
    board_id: Option<i64>,
    name: &str,
) -> Result<i64, Error> {
    let new_party = models::NewParty {
        party_name: name,
        board_id: board_id,
        chairman_id: user_id,
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

pub fn get_party_by_name(conn: &PgConnection, name: &str) -> Result<models::Party, Error> {
    use schema::parties::dsl;
    let mut parties = dsl::parties
        .filter(dsl::party_name.eq(name))
        .load::<models::Party>(conn)
        .or(Err(Error::InternalError))?;
    if parties.len() == 1 {
        Ok(parties.pop().unwrap())
    } else {
        Err(Error::LogicError("找不到政黨", 404))
    }
}

pub fn get_member_power(conn: &PgConnection, user_id: &str, party_id: i64) -> Result<i16, Error> {
    use schema::party_members::dsl;
    let membership = dsl::party_members
        .filter(dsl::party_id.eq(party_id))
        .filter(dsl::user_id.eq(user_id))
        .first::<models::PartyMember>(conn)
        .or(Err(Error::LogicError("找不到政黨成員", 404)))?;
    Ok(membership.power)
}
