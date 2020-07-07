use carbonbond::config::{get_config, initialize_config};
use refinery::config::{Config, ConfigDbType};
use rustyline::Editor;
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
    #[structopt(about = "打開資料庫")]
    Start,
    #[structopt(about = "離開", alias = "q")]
    Quit,
    #[structopt(about = "洗掉資料庫")]
    Reset,
    #[structopt(about = "資料庫遷移", alias = "m")]
    Migrate { version: Option<String> },
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
                    handle_root(cmd, &mut login_name);
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
    loop {
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
            Ok(root) => {
                let abort = handle_root(root, &mut login_name);
                if abort {
                    break;
                }
            }
            Err(err) => println!("{}", err),
        }
    }
}

fn check_login(login_name: &Option<String>) -> Result<&String, String> {
    match login_name {
        Some(name) => Ok(name),
        _ => Err("尚未登入".to_owned()),
    }
}

fn handle_root(root: Root, login_name: &mut Option<String>) -> bool {
    match root {
        Root::Login { user_name } => *login_name = Some(user_name),
        Root::Start => println!("打開！"),
        Root::Quit => return true,
        Root::Add(add) => match handle_add(add.subcmd, login_name) {
            Err(err) => println!("{}", err),
            _ => (),
        },
        Root::Migrate { version } => {
            let version = version.unwrap_or_else(|| "最高版本".to_string());
            println!("遷移至 {}", version);
        }
        _ => println!("尚未實作"),
    }
    false
}

fn handle_add(subcmd: AddSubCommand, login_name: &mut Option<String>) -> Result<(), String> {
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
