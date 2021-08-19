use carbonbond::{
    api::model::User,
    config::{get_config, init as init_config},
    custom_error::{Error, ErrorCode, Fallible},
    db,
};
use rustyline::Editor;
use std::io::Write;
use structopt::StructOpt;

mod bin_util;
use bin_util::{clean_db, migrate, run_cmd};

#[derive(StructOpt, Debug)]
struct ArgRoot {
    #[structopt(short, long)]
    user: Option<String>,
    #[structopt(short, long)]
    config: Option<String>,
    #[structopt(subcommand)]
    subcmd: Option<Root>,
}
#[derive(StructOpt, Debug)]
enum Root {
    #[structopt(about = "登入")]
    Login { user_name: String },
    #[structopt(about = "初始化資料庫，如果資料庫非空則退出。")]
    Init,
    #[structopt(about = "打開資料庫")]
    Start,
    #[structopt(about = "關閉資料庫")]
    Stop,
    #[structopt(about = "離開", alias = "q")]
    Quit,
    #[structopt(about = "重置資料庫。若資料庫不存在則創建之。")]
    Reset(Reset),
    #[structopt(about = "資料庫遷移", alias = "m")]
    Migrate,
    #[structopt(about = "列出資料庫", alias = "l")]
    List,
    #[structopt(about = "往資料庫塞點什麼", alias = "a")]
    Add(Add),
}
#[derive(StructOpt, Debug)]
struct Reset {
    #[structopt(short, long, help = "不進行資料庫遷移")]
    no_migrate: bool,
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

#[tokio::main]
async fn main() -> () {
    env_logger::init();
    let mut user: Option<User> = None;
    let args = std::env::args();
    if args.len() != 1 {
        match ArgRoot::from_iter_safe(args) {
            Ok(root) => {
                init_config(root.config);
                db::init().await.unwrap();
                if let Some(name) = &root.user {
                    login(&mut user, name).await.unwrap();
                }
                if let Some(cmd) = root.subcmd {
                    handle_root(cmd, &mut user).await.unwrap();
                    return;
                }
            }
            Err(err) => {
                println!("{}", err);
                return;
            }
        }
    } else {
        init_config(None);
        db::init().await.unwrap();
    }
    let mut rl = Editor::<()>::new();
    let mut quit = false;
    while !quit {
        let name = user.as_ref().map_or("", |u| &u.user_name);
        let line = rl.readline(&format!("{}> ", name)).unwrap();
        let words: Vec<_> = line
            .split("&&")
            .map(|s| s.trim())
            .filter(|s| s.len() != 0)
            .collect();
        if words.len() == 0 {
            continue;
        }
        rl.add_history_entry(&line);
        for word in words {
            let mut args = vec!["#"];
            args.extend(word.split(" ").filter(|s| s.len() != 0));
            match Root::from_iter_safe(args) {
                Ok(root) => match handle_root(root, &mut user).await {
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
}

async fn login(user: &mut Option<User>, name: &str) -> Fallible<()> {
    let user_found = db::user::get_by_name(name).await?;
    *user = Some(user_found);
    Ok(())
}
fn check_login(user: &Option<User>) -> Fallible<&User> {
    match user {
        Some(u) => Ok(u),
        _ => Err(ErrorCode::NeedLogin.into()),
    }
}

async fn handle_root(root: Root, user: &mut Option<User>) -> Fallible<bool> {
    let conf = &get_config().database;
    let db_name = &conf.dbname;
    match root {
        Root::Login { user_name } => login(user, &user_name).await?,
        Root::Start => start_db()?,
        Root::Stop => stop_db()?,
        Root::Init => {
            init_db()?;
            start_db()?;
            create_db()?;
        }
        Root::Reset(reset) => {
            let exist = list_db()?.contains(db_name);
            if exist {
                println!("{} 已存在，清空之", db_name);
                clean_db(conf)?;
            } else {
                println!("找不到 {}，創建之", db_name);
                create_db()?;
            }
            if !reset.no_migrate {
                migrate().await?
            }
        }
        Root::Quit => return Ok(true),
        Root::Add(add) => handle_add(add.subcmd, user).await?,
        Root::Migrate => migrate().await?,
        Root::List => {
            for db in list_db()? {
                let prefix = if &db == db_name { "* " } else { "" };
                println!("{}{}", prefix, db);
            }
        }
    }
    Ok(false)
}

fn list_db() -> Fallible<Vec<String>> {
    let conf = &get_config().database;
    let db_list = run_cmd(
        "psql",
        &[
            "-p",
            &conf.port.to_string(),
            "-U",
            &conf.username,
            "-d",
            "postgres",
            "-c",
            "COPY (SELECT datname from pg_database where datistemplate=false) TO STDOUT",
        ],
        &[("PGPASSWORD", &conf.password)],
        true,
    )?;
    Ok(db_list)
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
        false,
    )
    .map_err(|e| match e {
        Error::OperationError { .. } => {
            e.context("若排除其它問題仍無法開啟資料庫，建議執行： sudo service postgresql restart")
        }
        _ => e,
    })?;
    Ok(())
}
fn stop_db() -> Fallible<()> {
    let conf = &get_config().database;
    run_cmd("pg_ctl", &["-D", &conf.data_path, "stop"], &[], false)?;
    Ok(())
}
fn init_db() -> Fallible<()> {
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
        false,
    )?;
    Ok(())
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
        false,
    )?;
    Ok(())
}
async fn handle_add(subcmd: AddSubCommand, user: &mut Option<User>) -> Fallible<()> {
    match subcmd {
        AddSubCommand::User {
            name,
            email,
            password,
        } => {
            db::user::signup(&name, &password, &email).await?;
        }
        AddSubCommand::Board {
            board_name,
            party_name,
        } => {
            let _user = check_login(user)?;
        }
        AddSubCommand::Party { board_name, name } => {
            let _user = check_login(user)?;
        }
    }
    Ok(())
}
