#[macro_use]
extern crate derive_more;

pub mod config;
pub mod custom_error;
pub mod force;

#[cfg(not(feature = "prepare"))]
pub mod api;
#[cfg(not(feature = "prepare"))]
pub mod chat;
#[cfg(not(feature = "prepare"))]
pub mod db;
#[cfg(not(feature = "prepare"))]
pub mod email;
#[cfg(not(feature = "prepare"))]
pub mod notification;
#[cfg(not(feature = "prepare"))]
pub mod redis;
#[cfg(not(feature = "prepare"))]
pub mod routes;
#[cfg(not(feature = "prepare"))]
pub mod service;
#[cfg(not(feature = "prepare"))]
pub mod service_manager;
#[cfg(not(feature = "prepare"))]
pub mod util;

#[cfg(not(feature = "prepare"))]
pub mod context;

#[cfg(not(feature = "prepare"))]
use context::{Context, Ctx};
