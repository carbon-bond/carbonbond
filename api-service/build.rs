#[macro_use]
extern crate derive_more;

#[path = "src/config/config.rs"]
mod config;
#[path = "src/custom_error.rs"]
mod custom_error;
#[path = "src/force.rs"]
mod force;
#[path = "src/api/model/mod.rs"]
mod model;
#[path = "src/api/query.rs"]
mod query;
use chitin::{CodegenOption, Language, Side};
use query::RootQuery;
use std::fs::File;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
    println!("cargo:rerun-if-changed=config");
    println!("cargo:rerun-if-changed=src/api/model/mod.rs");
    println!("cargo:rerun-if-changed=src/api/model/chat.rs");
    println!("cargo:rerun-if-changed=src/api/model/forum.rs");
    println!("cargo:rerun-if-changed=src/api/query.rs");

    env_logger::init();

    #[cfg(debug_assertions)]
    {
        gen_api_files()?;
    }

    // set database url
    let conf = config::load_config(&None).unwrap();
    log::info!("使用資料庫 url {}", conf.database.get_url());

    println!("cargo:rustc-env=DATABASE_URL={}", conf.database.get_url());

    Ok(())
}

#[cfg(debug_assertions)]
fn gen_api_files() -> std::io::Result<()> {
    let chitin_entry = RootQuery::get_root_entry();

    // 生成幾丁伺服器端樁
    let server_option = CodegenOption {
        side: Side::Server {
            context: "&mut crate::Ctx",
        },
        language: Language::Rust,
        error: "crate::custom_error::Error",
    };
    let mut server_file = File::create("src/api/api_trait.rs")?;
    server_file.write_all(b"use crate::api::query::*;\n")?;
    server_file.write_all(b"use std::collections::HashMap;\n")?;
    server_file.write_all(b"use chrono::{DateTime, Utc};\n")?;
    server_file.write_all(server_option.prelude().as_bytes())?;
    chitin_entry.root_codegen(&server_option, &mut server_file)?;

    // 生成幾丁客戶端
    let client_option = CodegenOption {
        side: Side::Client,
        language: Language::TypeScript,
        error: "Error",
    };

    let mut client_file = File::create("../frontend/src/ts/api/api_trait.ts")?;
    client_file.write_all(b"/*eslint-disable*/\n")?;
    client_file.write_all(b"export type BoxedErr = string\n")?;
    client_file.write_all(b"export type ValidationError = string\n")?;
    client_file.write_all(b"export type ForceLangError = string\n")?;
    client_file.write_all(
        b"// @ts-ignore\nexport type HashMap<K extends string | number, T> = { [key: K]: T };\n",
    )?;
    client_file.write_all(client_option.prelude().as_bytes())?;
    client_file.write_all(model::forum::gen_typescript().as_bytes())?;
    client_file.write_all(model::chat::chat_model_root::gen_typescript().as_bytes())?;
    client_file.write_all(custom_error::gen_typescript().as_bytes())?;
    chitin_entry.root_codegen(&client_option, &mut client_file)?;

    Ok(())
}
