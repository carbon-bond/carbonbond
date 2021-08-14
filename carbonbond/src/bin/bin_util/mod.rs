use carbonbond::{
    config::{get_config, DatabaseConfig},
    custom_error::{Contextable, Error, Fallible},
};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};

use sqlx::migrate::{Migrate, MigrateError, Migrator};
use sqlx::{AnyConnection, Connection};

pub fn run_cmd(
    program: &str,
    args: &[&str],
    env: &[(&str, &str)],
    mute: bool,
) -> Fallible<Vec<String>> {
    log::info!("執行命令行指令：{} {:?}", program, args);
    let mut cmd = Command::new(program);
    cmd.args(args);
    for (key, value) in env.iter() {
        cmd.env(key, value);
    }
    let mut child = cmd
        .stdout(Stdio::piped())
        .spawn()
        .context(format!("執行 {} 指令失敗", program))?;

    if let Some(stdout) = &mut child.stdout {
        let mut out_str = vec![];
        let reader = BufReader::new(stdout);
        reader
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| {
                if !mute {
                    println!("  ==> {}", line);
                }
                out_str.push(line);
            });

        let status = child.wait()?;
        if status.success() {
            Ok(out_str)
        } else {
            Err(Error::new_op(format!(
                "{} 指令異常退出，狀態碼 = {:?}",
                program,
                status.code().unwrap_or(0)
            )))
        }
    } else {
        return Err(Error::new_internal(format!(
            "無法取得 {} 之標準輸出",
            program
        )));
    }
}

pub fn clean_db(conf: &DatabaseConfig) -> Fallible<()> {
    let command = format!(
        "
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT distinct schemaname FROM pg_catalog.pg_tables
        WHERE schemaname <> 'pg_catalog'
        AND schemaname <> 'information_schema') LOOP
    EXECUTE 'DROP SCHEMA ' || r.schemaname || ' CASCADE';
  END LOOP;

  EXECUTE 'CREATE SCHEMA public';
  ALTER USER \"{}\" SET search_path = public;
END $$;",
        conf.username
    );

    run_cmd(
        "psql",
        &[
            "-p",
            &conf.port.to_string(),
            "-U",
            &conf.username,
            "-d",
            &conf.dbname,
            "-h",
            &conf.host,
            "-c",
            &command,
        ],
        &[("PGPASSWORD", &conf.password)],
        false,
    )?;
    Ok(())
}

pub async fn migrate() -> Fallible<()> {
    let conf = &get_config().database;
    let migrator = Migrator::new(std::path::Path::new("./migrations")).await?;
    let mut conn = AnyConnection::connect(&conf.get_url()).await?;

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

    Ok(())
}
