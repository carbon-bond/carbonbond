#[path = "api/model.rs"]
mod model;
#[path = "api/query.rs"]
mod query;
use carbonbond::{config::load_config, custom_error::Fallible};
use chitin::{ChitinCodegen, CodegenOption};
use query::RootQuery;
use std::fs::File;
use std::io::Write;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
struct Arg {
    #[structopt(short, long)]
    frontend_chitin: bool,
    #[structopt(short, long)]
    backend_chitin: bool,
    #[structopt(short, long)]
    sqlx: bool,
}
impl Arg {
    fn init(&mut self) {
        // structopt::clap::AppSettings;
        match (self.frontend_chitin, self.backend_chitin, self.sqlx) {
            (false, false, false) => {
                self.frontend_chitin = true;
                self.backend_chitin = true;
                self.sqlx = true;
            }
            _ => (),
        }
    }
}
fn main() -> Fallible<()> {
    let mut arg = Arg::from_args();
    arg.init();
    if arg.backend_chitin {
        let mut server_file = File::create("src/api/api_trait.rs")?;
        server_file.write_all(b"use async_trait::async_trait;\n")?;
        server_file.write_all(b"use crate::api::query::*;\n")?;
        server_file.write_all(b"use serde_json::error::Error;\n")?;
        server_file.write_all(
            RootQuery::codegen(&CodegenOption::Server {
                error: "crate::custom_error::Error",
                context: "&mut crate::Ctx",
            })
            .as_bytes(),
        )?;
    }

    if arg.frontend_chitin {
        let mut client_file = File::create("frontend/src/ts/api/api_trait.ts")?;
        client_file.write_all(b"/*eslint-disable*/\n")?;
        client_file.write_all(b"export type Option<T> = T | null;\n")?;
        client_file.write_all(
            b"export type Result<T, E> = {
    'Ok': T
} | {
    'Err': E
};\n",
        )?;
        client_file.write_all(model::gen_typescript().as_bytes())?;
        client_file
            .write_all(RootQuery::codegen(&CodegenOption::Client { error: "any" }).as_bytes())?;
    }
    if arg.sqlx {
        let conf = load_config(&None)?.database;
        let mut cmd = std::process::Command::new("cargo");
        cmd.args(&["sqlx", "prepare", "--", "--bin", "server"]);
        cmd.env("DATABASE_URL", &conf.get_url());
        cmd.spawn().unwrap().wait().unwrap();
    }
    Ok(())
}
