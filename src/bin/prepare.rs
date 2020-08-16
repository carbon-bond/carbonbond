mod bin_util;
use carbonbond::{config::load_config, custom_error::Fallible};
use sqlx_beta::migrate::{Migrate, MigrateDatabase, MigrateError, Migrator};
use sqlx_beta::{any::Any, AnyConnection, Connection};
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
struct Arg {
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
