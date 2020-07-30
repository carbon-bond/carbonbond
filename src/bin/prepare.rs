#[path = "../api/model.rs"]
mod model;
#[path = "../api/query.rs"]
mod query;
use carbonbond::{bin_util, config::load_config, custom_error::Fallible};
use chitin::{ChitinCodegen, CodegenOption};
use query::RootQuery;
use sqlx_beta::migrate::{Migrate, MigrateDatabase, MigrateError, Migrator};
use sqlx_beta::{any::Any, AnyConnection, Connection};
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
    #[structopt(short, long)]
    migrate: bool,
    #[structopt(short, long)]
    clean: bool,
}

#[tokio::main]
async fn main() -> Fallible<()> {
    let arg = Arg::from_args();
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
    let conf = load_config(&None)?.database;
    if arg.sqlx {
        let mut cmd = std::process::Command::new("cargo");
        cmd.args(&["sqlx", "prepare", "--", "--bin", "server"]);
        cmd.env("DATABASE_URL", &conf.get_url());
        cmd.spawn().unwrap().wait().unwrap();
    }
    if arg.clean {
        bin_util::clean_db(&conf)?;
    }
    if arg.migrate {
        // 資料庫遷移
        let url = conf.get_url();
        if !Any::database_exists(&url).await? {
            log::info!("創建資料庫：{}", url);
            Any::create_database(&url).await?;
        }
        let migrator = Migrator::new(std::path::Path::new("./migrations")).await?;
        let mut conn = AnyConnection::connect(&url).await?;
        conn.ensure_migrations_table().await?;

        let (version, dirty) = conn.version().await?.unwrap_or((0, false));

        if dirty {
            return Err(MigrateError::Dirty(version).into());
        }

        for migration in migrator.iter() {
            if migration.version > version {
                let elapsed = conn.apply(migration).await?;
                println!(
                    "{}/遷移 {} ({:?})",
                    migration.version, migration.description, elapsed,
                );
            } else {
                conn.validate(migration).await?;
            }
        }
    }
    Ok(())
}
