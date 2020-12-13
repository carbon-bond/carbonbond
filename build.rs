#[macro_use]
extern crate derive_more;

#[path = "src/config/config.rs"]
mod config;
#[path = "src/custom_error.rs"]
mod custom_error;
#[path = "src/api/model.rs"]
mod model;
#[path = "src/api/query.rs"]
mod query;
use chitin::{ChitinCodegen, CodegenOption};
use query::RootQuery;
use std::fs::File;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
    println!("cargo:rerun-if-changed=PATH=config");
    // build server chitin
    env_logger::init();
    let mut server_file = File::create("src/api/api_trait.rs")?;
    server_file.write_all(b"use async_trait::async_trait;\n")?;
    server_file.write_all(b"use crate::api::query::*;\n")?;
    server_file.write_all(b"use std::collections::HashMap;\n")?;
    server_file.write_all(b"use chrono::{DateTime, Utc};\n")?;
    server_file.write_all(b"use serde_json::error::Error;\n")?;
    server_file.write_all(
        RootQuery::codegen(&CodegenOption::Server {
            error: "crate::custom_error::Error",
            context: "&mut crate::Ctx",
        })
        .as_bytes(),
    )?;

    // build frontend chitin
    let mut client_file = File::create("frontend/src/ts/api/api_trait.ts")?;
    client_file.write_all(b"/*eslint-disable*/\n")?;
    client_file.write_all(b"export type Option<T> = T | null;\n")?;
    client_file.write_all(b"export type BoxedErr = string\n")?;
    client_file.write_all(b"export type ForceValidateError<T> = string\n")?;
    client_file.write_all(
        b"// @ts-ignore\nexport type HashMap<K extends string | number, T> = { [key: K]: T };\n",
    )?;
    client_file.write_all(
        b"export type Result<T, E> = {
    'Ok': T
} | {
    'Err': E
};\n",
    )?;
    client_file.write_all(model::gen_typescript().as_bytes())?;
    client_file.write_all(custom_error::gen_typescript().as_bytes())?;
    client_file
        .write_all(RootQuery::codegen(&CodegenOption::Client { error: "Error" }).as_bytes())?;
    // set database url
    let conf = config::load_config(&None).unwrap();
    log::info!("使用資料庫 url {}", conf.database.get_url());

    println!("cargo:rustc-env=DATABASE_URL={}", conf.database.get_url());

    Ok(())
}
