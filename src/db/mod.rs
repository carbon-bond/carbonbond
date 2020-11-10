use crate::config::get_config;
use crate::custom_error::{DataType, ErrorCode, Fallible};
use sqlx::postgres::PgPool;
use state::Storage;

pub mod article;
pub mod article_content;
pub mod avatar;
pub mod board;
pub mod notification;
pub mod party;
pub mod subscribed_boards;
pub mod user;

static POOL: Storage<PgPool> = Storage::new();

pub async fn init() -> Fallible<()> {
    let conf = &get_config().database;
    let pool = PgPool::builder()
        .max_size(20)
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
    fn to_fallible<U: ToString>(self, target: U) -> Fallible<T>;
}
trait ToTypedFallible<T> {
    fn to_typed_fallible<U: ToString>(self, ty: DataType, target: U) -> Fallible<T>;
}

impl<T: DBObject> ToFallible<T> for Result<T, sqlx::Error> {
    fn to_fallible<U: ToString>(self, target: U) -> Fallible<T> {
        self.to_typed_fallible(T::TYPE, target)
        // match self {
        //     Ok(t) => Ok(t),
        //     Err(sqlx::Error::RowNotFound) => {
        //         Err(ErrorCode::NotFound(T::TYPE, target.to_string()).into())
        //     }
        //     Err(err) => Err(err.into()),
        // }
    }
}

impl<T> ToTypedFallible<T> for Result<T, sqlx::Error> {
    fn to_typed_fallible<U: ToString>(self, ty: DataType, target: U) -> Fallible<T> {
        match self {
            Ok(t) => Ok(t),
            Err(sqlx::Error::RowNotFound) => {
                Err(ErrorCode::NotFound(ty, target.to_string()).into())
            }
            Err(err) => Err(err.into()),
        }
    }
}
