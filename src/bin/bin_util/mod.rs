use carbonbond::{
    config::DatabaseConfig,
    custom_error::{Error, Fallible},
};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};

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
        .map_err(|e| Error::new_internal(format!("執行 {} 指令失敗", program), e))?;

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
        return Err(Error::new_internal_without_source(format!(
            "無法取得 {} 之標準輸出",
            program
        )));
    }
}

pub fn clean_db(conf: &DatabaseConfig) -> Fallible<()> {
    let command = "
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
    EXECUTE 'DROP TABLE ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;";

    run_cmd(
        "psql",
        &[
            "-p",
            &conf.port.to_string(),
            "-U",
            &conf.username,
            "-d",
            &conf.dbname,
            "-c",
            command,
        ],
        &[("PGPASSWORD", &conf.password)],
        false,
    )?;
    Ok(())
}
