use crate::config::get_config;
use crate::custom_error::{DataType, Error, ErrorCode, Fallible};
use sqlx::postgres::PgPool;
use state::Storage;

pub mod board;
pub mod user;

static POOL: Storage<PgPool> = Storage::new();

pub async fn init() -> Fallible<()> {
    let conf = &get_config().database;
    let pool = PgPool::builder()
        .max_size(conf.max_conn)
        .build(&conf.get_url())
        .await?;
    assert!(POOL.set(pool), "資料庫連接池被重複創建",);
    Ok(())
}

pub fn get_pool() -> &'static PgPool {
    POOL.get()
}

trait DBObject {
    const TYPE: DataType;
}
trait ToFallible<T: DBObject> {
    fn to_fallible(self, target: &str) -> Fallible<T>;
}
impl<T: DBObject> ToFallible<T> for Result<T, sqlx::Error> {
    fn to_fallible(self, target: &str) -> Fallible<T> {
        match self {
            Ok(t) => Ok(t),
            Err(sqlx::Error::RowNotFound) => Err(Error::new_logic(
                ErrorCode::NotFound(T::TYPE, target.to_string()),
                "",
            )),
            Err(err) => Err(err.into()),
        }
    }
}
