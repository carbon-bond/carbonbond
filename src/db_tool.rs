use carbonbond::{
    config::{get_config, initialize_config},
    custom_error::{Error, ErrorCode, Fallible},
};
use refinery::config::{Config, ConfigDbType};
use rustyline::Editor;
use std::process::{Command, Stdio};
use structopt::StructOpt;

mod embedded {
    refinery::embed_migrations!("migrations");
}

#[derive(StructOpt, Debug)]
struct ArgRoot {
    #[structopt(long)]
    user: Option<String>,
    #[structopt(short, long)]
    config: Option<String>,
    #[structopt(subcommand)]
    subcmd: Option<Root>,
}
#[derive(StructOpt, Debug)]
enum Root {
    #[structopt(about = "登入", alias = "q")]
    Login { user_name: String },
    #[structopt(about = "初始化資料庫，如果資料庫非空則退出。")]
    Init,
    #[structopt(about = "打開資料庫")]
    Start,
    #[structopt(about = "關閉資料庫")]
    Stop,
    #[structopt(about = "離開", alias = "q")]
    Quit,
    #[structopt(about = "洗掉資料庫")]
    Reset,
    #[structopt(about = "資料庫遷移", alias = "m")]
    Migrate,
    #[structopt(about = "往資料庫塞點什麼", alias = "a")]
    Add(Add),
}
#[derive(StructOpt, Debug)]
struct Add {
    #[structopt(subcommand)]
    subcmd: AddSubCommand,
}
#[derive(StructOpt, Debug)]
enum AddSubCommand {
    #[structopt(alias = "u")]
    User {
        name: String,
        password: String,
        email: String,
    },
    #[structopt(alias = "b")]
    Board {
        board_name: String,
        party_name: String,
    },
    #[structopt(alias = "p")]
    Party {
        name: String,
        board_name: Option<String>,
    },
}

fn main() {
    env_logger::init();
    let mut login_name: Option<String> = None;
    let args = std::env::args();
    if args.len() != 1 {
        match ArgRoot::from_iter_safe(args) {
            Ok(root) => {
                login_name = root.user;
                initialize_config(root.config);
                if let Some(cmd) = root.subcmd {
                    handle_root(cmd, &mut login_name).unwrap();
                    return;
                }
                // handle_root(root, &mut login_name);
            }
            Err(err) => {
                println!("{}", err);
                return;
            }
        }
    } else {
        initialize_config(None);
    }
    let mut rl = Editor::<()>::new();
    let mut quit = false;
    while !quit {
        let mut args = vec!["#"];
        let line = rl
            .readline(&format!("{}> ", login_name.clone().unwrap_or_default()))
            .unwrap();
        args.extend(line.split(" ").filter(|s| s.len() != 0));
        if args.len() == 1 {
            continue;
        }
        rl.add_history_entry(line.as_str());
        match Root::from_iter_safe(args) {
            Ok(root) => match handle_root(root, &mut login_name) {
                Ok(true) => {
                    quit = true;
                    break;
                }
                Err(err) => println!("{}", err),
                _ => (),
            },
            Err(err) => println!("{}", err),
        }
    }
}

fn check_login(login_name: &Option<String>) -> Fallible<&String> {
    match login_name {
        Some(name) => Ok(name),
        _ => Err(Error::new_logic(ErrorCode::NeedLogin, "")),
    }
}

fn handle_root(root: Root, login_name: &mut Option<String>) -> Fallible<bool> {
    match root {
        Root::Login { user_name } => *login_name = Some(user_name),
        Root::Start => start_db()?,
        Root::Stop => stop_db()?,
        Root::Init => {
            init_db()?;
            start_db()?;
            create_db()?;
        }
        Root::Quit => return Ok(true),
        Root::Add(add) => handle_add(add.subcmd, login_name)?,
        Root::Migrate => {
            let conf = &get_config().database;
            let mut ref_conf = Config::new(ConfigDbType::Postgres)
                .set_db_host(&conf.host)
                .set_db_port(&conf.port.to_string())
                .set_db_user(&conf.username)
                .set_db_name(&conf.dbname)
                .set_db_pass(&conf.password);
            embedded::migrations::runner().run(&mut ref_conf)?;
        }
        _ => println!("尚未實作"),
    }
    Ok(false)
}

fn start_db() -> Fallible<()> {
    let conf = &get_config().database;
    run_cmd(
        "pg_ctl",
        &[
            "-o",
            &format!("\"-p{}\"", conf.port),
            "start",
            "-w",
            "-D",
            &conf.data_path,
            "-l",
            "./postgres.log",
        ],
        &[],
    )
    .map_err(|e| match e {
        Error::OperationError { msg } => Error::new_op(format!(
            "{}\n若排除其它問題仍無法開啟資料庫，建議執行：\n   sudo service postgresql restart",
            msg
        )),
        _ => e,
    })
}
fn stop_db() -> Fallible<()> {
    let conf = &get_config().database;
    run_cmd("pg_ctl", &["-D", &conf.data_path, "stop"], &[])
}
fn init_db() -> Fallible<()> {
    use std::io::Write;
    let conf = &get_config().database;
    let mut pass_file = tempfile::NamedTempFile::new_in(".")?;
    writeln!(pass_file, "{}", conf.password)?;
    run_cmd(
        "initdb",
        &[
            "-D",
            &conf.data_path,
            "-A",
            "password",
            "-U",
            &conf.username,
            "-E",
            "UTF-8",
            &format!("--pwfile={}", pass_file.path().to_str().unwrap_or("")),
        ],
        &[],
    )
}
fn create_db() -> Fallible<()> {
    let conf = &get_config().database;
    run_cmd(
        "psql",
        &[
            "-p",
            &conf.port.to_string(),
            "-U",
            &conf.username,
            "-d",
            "postgres",
            "-c",
            &format!("CREATE DATABASE {} ENCODING 'utf8';", conf.dbname),
        ],
        &[("PGPASSWORD", &conf.password)],
    )
}
fn handle_add(subcmd: AddSubCommand, login_name: &mut Option<String>) -> Fallible<()> {
    match subcmd {
        AddSubCommand::User {
            name,
            email,
            password,
        } => *login_name = Some(name),
        AddSubCommand::Board {
            board_name,
            party_name,
        } => {
            let login_name = check_login(login_name)?;
            ()
        }
        _ => (),
    }
    Ok(())
}
fn run_cmd(program: &str, args: &[&str], env: &[(&str, &str)]) -> Fallible<()> {
    log::info!("執行命令行指令：{} {:?}", program, args);
    let mut cmd = Command::new(program);
    cmd.args(args);
    for (key, value) in env.iter() {
        cmd.env(key, value);
    }
    let mut child = cmd
        .spawn()
        .map_err(|e| Error::new_internal(format!("執行 {} 指令失敗", program), e))?;
    let status = child.wait()?;
    if status.success() {
        Ok(())
    } else {
        Err(Error::new_op(format!(
            "{} 指令異常退出，狀態碼 = {:?}",
            program,
            status.code().unwrap_or(0)
        )))
    }
}
