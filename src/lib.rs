#[macro_use]
extern crate derive_more;

pub mod api;
pub mod config;
pub mod custom_error;

pub const MAX_ARTICLE_FIELD: usize = 15;

use crate::custom_error::Fallible;

pub trait Context {
    fn remember_id(&self, id: i64) -> Fallible<()>;
    fn forget_id(&self) -> Fallible<()>;
    fn get_id(&self) -> Option<i64>;
}

pub struct Ctx {
    // session: Session,
}
impl Ctx {}
impl Context for Ctx {
    fn remember_id(&self, id: i64) -> Fallible<()> {
        unimplemented!()
    }

    fn forget_id(&self) -> Fallible<()> {
        unimplemented!()
    }

    fn get_id(&self) -> Option<i64> {
        unimplemented!()
    }
}
