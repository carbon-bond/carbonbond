use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::result::Error as DBError;

use crate::forum;
use crate::db::{models, schema};
use crate::custom_error::{Error, Fallible, ErrorKey, DataType};
use crate::Context;

/// 回傳剛創的政黨 id
pub fn create_party<C: Context>(ctx: &C, board_name: Option<&str>, name: &str) -> Fallible<i64> {
    // TODO: 鍵能之類的檢查
    let user_id = ctx.get_id().ok_or(Error::new_logic(ErrorKey::NeedLogin))?;
    ctx.use_pg_conn(|conn| {
        let board_id = match board_name {
            Some(name) => Some(forum::get_board_by_name(&conn, name)?.id),
            None => None,
        };
        check_party_name_valid(&conn, name)?;
        create_party_db(&conn, user_id, board_id, name)
    })
}

/// 回傳剛創的政黨 id
fn create_party_db(
    conn: &PgConnection,
    user_id: i64,
    board_id: Option<i64>,
    name: &str,
) -> Fallible<i64> {
    let new_party = models::NewParty {
        party_name: name,
        board_id: board_id,
        chairman_id: user_id,
    };
    let party: models::Party = diesel::insert_into(schema::parties::table)
        .values(&new_party)
        .get_result(conn)?;

    // 把自己加進去當主席
    add_party_member(&conn, user_id, party.id, 3)?;

    Ok(party.id)
}

fn add_party_member(
    conn: &PgConnection,
    user_id: i64,
    party_id: i64,
    position: i16,
) -> Fallible<()> {
    let new_member = models::NewPartyMember {
        position,
        user_id,
        party_id,
        dedication_ratio: 10,
        board_id: None,
    };
    diesel::insert_into(schema::party_members::table)
        .values(&new_member)
        .execute(conn)?;
    Ok(())
}

pub fn get_party_by_name(conn: &PgConnection, name: &str) -> Fallible<models::Party> {
    use schema::parties::dsl;
    dsl::parties
        .filter(dsl::party_name.eq(name))
        .first::<models::Party>(conn)
        .map_err(|e| match e {
            DBError::NotFound => Error::new_not_found(DataType::Party, name),
            _ => e.into(),
        })
}

pub fn get_member_position(conn: &PgConnection, user_id: i64, party_id: i64) -> Fallible<i16> {
    use schema::party_members::dsl;
    let member = dsl::party_members
        .filter(dsl::party_id.eq(party_id))
        .filter(dsl::user_id.eq(user_id))
        .first::<models::PartyMember>(conn);

    match member {
        Ok(m) => Ok(m.position),
        Err(DBError::NotFound) => Ok(0),
        Err(e) => Err(e.into()),
    }
}

pub fn check_party_name_valid(conn: &PgConnection, name: &str) -> Fallible<()> {
    if name.len() == 0 {
        Err(Error::new_bad_op("黨名長度不可為零").into())
    } else if name.contains(' ') || name.contains('\n') || name.contains('"') || name.contains('\'')
    {
        Err(Error::new_bad_op("政黨名帶有不合法字元").into())
    } else {
        if get_party_by_name(&conn, name).is_ok() {
            Err(Error::new_bad_op("與其它政黨重名").into())
        } else {
            Ok(())
        }
    }
}
