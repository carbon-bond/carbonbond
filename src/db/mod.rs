use diesel::{pg::PgConnection, r2d2::ConnectionManager};
use r2d2::ManageConnection;
use state::Storage;
use crate::custom_error::Fallible;

pub mod models;
pub mod schema;

pub static DB_CONN_MGR: Storage<ConnectionManager<PgConnection>> = Storage::new();

pub fn init_db(url: &str) {
    let is_set_once = DB_CONN_MGR.set({
        let mgr = ConnectionManager::new(url);
        mgr
    });
    assert!(is_set_once, "init_db() 只能被呼叫一次 ");
}

pub fn connect_db() -> Fallible<PgConnection> {
    let mgr = DB_CONN_MGR.get();
    let conn = mgr.connect()?;
    Ok(conn)
}
