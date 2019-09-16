#[macro_use]
extern crate clap;
extern crate rustyline;

use std::{fs, path::PathBuf};
use diesel::PgConnection;
use rustyline::{Editor, error::ReadlineError, config::Config as RustyLineConfig};
use carbonbond::{
    user::{email, signup, find_user_by_name, find_user_by_id},
    custom_error::{Error, Fallible},
    config::{CONFIG, initialize_config, Mode},
    Context, forum, party, db,
};

static COMMAND_HISTORY_FILE: &'static str = ".db_tool_history";
static HELP_MSG: &'static str = "
<> 表示必填， [] 表示選填

run 子命令：
    run [指令集檔案位置]
        執行檔案中的命令，預設為 config/test_data.txt
add 子命令：
    add user <信箱地址> <使用者名稱> <密碼>
    add party <政黨名> [看板名]
        如果不填看板名，會建立流亡政黨
        如果填入已存在的看板名，會建立該板的在野黨
    add board <流亡政黨名> <看板名>
        如果找不到流亡政黨，會直接建立政黨及看板
as 子命令：
    as <使用者名稱>
        db-tool 會記住你的身份，在執行創黨/發文等等功能時自動填入
invite 子命令：
    invite <信箱地址>
reset
    清除資料庫並重建
exit
    離開程式
";

enum CommandResult {
    Success,
    Eof,
}

struct DBToolCtx {
    id: Option<i64>,
    line_editor: Editor<()>,
}

impl DBToolCtx {
    fn new() -> DBToolCtx {
        let editor_config = RustyLineConfig::builder()
            .max_history_size(100000)
            .history_ignore_dups(true)
            .history_ignore_space(true)
            .auto_add_history(true)
            .build();
        let mut line_editor = Editor::<()>::with_config(editor_config);
        line_editor.load_history(COMMAND_HISTORY_FILE).ok();

        DBToolCtx {
            id: None,
            line_editor,
        }
    }

    fn get_user(&self) -> Fallible<Option<db::models::User>> {
        match self.id {
            Some(id) => {
                let user = self.use_pg_conn(|conn| find_user_by_id(&conn, id))?;
                Ok(Some(user))
            }
            None => Ok(None),
        }
    }
}

impl Context for DBToolCtx {
    fn use_pg_conn<T, F>(&self, callback: F) -> Fallible<T>
    where
        F: FnOnce(PgConnection) -> Fallible<T>,
    {
        let ret = callback(db::connect_db()?)?;
        Ok(ret)
    }

    fn remember_id(&self, id: i64) -> Fallible<()> {
        let _s = self as *const Self as *mut Self;
        unsafe {
            (*_s).id = Some(id);
        }
        Ok(())
    }

    fn forget_id(&self) -> Fallible<()> {
        unimplemented!();
    }

    fn get_id(&self) -> Option<i64> {
        self.id.clone()
    }
}

fn match_subcommand(ctx: &mut DBToolCtx) -> Fallible<Option<(String, Vec<String>)>> {
    let prompt = match ctx.get_user()? {
        Some(user) => format!("{} > ", user.name),
        None => "> ".to_owned(),
    };

    let command = loop {
        let line = match ctx.line_editor.readline(&prompt) {
            Ok(line) => Ok(line),
            Err(ReadlineError::Eof) => {
                print!("^D");
                return Ok(None);
            }
            Err(ReadlineError::Interrupted) => {
                print!("^C");
                continue;
            }
            Err(error) => Err(error),
        }?;

        let words: Vec<String> = line.split_whitespace().map(|w| w.to_owned()).collect();
        if words.len() == 0 {
            continue;
        }

        break (words[0].clone(), words[1..].to_vec());
    };

    return Ok(Some(command));
}

fn add_something(ctx: &DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    if args.len() < 2 {
        return Err(Error::new_op("add 參數數量錯誤"));
    }
    let something = args[0].clone();
    let sub_args = args[1..].to_vec();
    match something.as_ref() {
        "user" => add_user(ctx, &sub_args),
        "party" => add_party(ctx, &sub_args),
        "board" => add_board(ctx, &sub_args),
        other => Err(Error::new_op(format!("無法 add {}", other))),
    }
}

fn add_user(ctx: &DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    if args.len() != 3 {
        return Err(Error::new_op("add user 參數數量錯誤"));
    }
    let conf = CONFIG.get();
    let (email, name, password) = (&args[0], &args[1], &args[2]);
    // TODO: create_user 內部要做錯誤處理
    ctx.use_pg_conn(|conn| {
        signup::create_user(&conn, email, name, password, conf.user.invitation_credit)
    })?;
    Ok(())
}

fn add_party(ctx: &DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    if args.len() == 1 {
        let party_name = &args[0];
        let id = party::create_party(ctx, None, party_name)?;
        println!("成功建立政黨，id = {}", id);
        Ok(())
    } else if args.len() == 2 {
        let (party_name, board) = (&args[0], &args[1]);
        let id = party::create_party(ctx, Some(board), party_name)?;
        println!("成功建立政黨，id = {}", id);
        Ok(())
    } else {
        Err(Error::new_op("add party 參數數量錯誤"))
    }
}

fn add_board(ctx: &DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    if args.len() != 2 {
        return Err(Error::new_op("add board 參數數量錯誤"));
    }
    let (party_name, board_name) = (&args[0], &args[1]);
    let find_party = ctx.use_pg_conn(|conn| party::get_party_by_name(&conn, party_name));
    if find_party.is_err() {
        let id = party::create_party(ctx, None, party_name)?;
        println!("建立政黨 {}, id = {}", party_name, id);
    }
    let id = forum::create_board(ctx, party_name, board_name)?;
    println!("成功建立看板，id = {}", id);
    Ok(())
}

fn invite(ctx: &DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    ctx.use_pg_conn(|conn| {
        let invite_code = signup::create_invitation(&conn, ctx.get_id(), &args[0], "")?;
        email::send_invite_email(&conn, ctx.get_id(), &invite_code, &args[0], "")?;
        Ok(())
    })?;
    Ok(())
}

fn as_user(ctx: &mut DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    let name = &args[0];
    let user = ctx.use_pg_conn(|conn| find_user_by_name(&conn, name))?;
    ctx.remember_id(user.id)?;
    Ok(())
}

fn reset_database(ctx: &mut DBToolCtx) -> Fallible<()> {
    let conf = CONFIG.get();
    if let Mode::Release = conf.mode {
        println!("危險操作！請輸入 carbonbond 以繼續");

        let prompt = match ctx.get_user()? {
            Some(user) => format!("{} (reset)> ", user.name),
            None => "(reset)> ".to_owned(),
        };
        let line = loop {
            use ReadlineError::*;

            let line = match ctx.line_editor.readline(&prompt) {
                Ok(line) => Ok(line),
                Err(Interrupted) | Err(Eof) => {
                    println!("操作取消");
                    return Ok(());
                }
                Err(error) => Err(error),
            }?;

            break line;
        };

        if &line != "carbonbond\n" {
            println!("操作取消");
            return Ok(());
        }
    }

    let out = std::process::Command::new("diesel")
        .arg("database")
        .arg("reset")
        .arg("--database-url")
        .arg(&conf.database.url)
        .output()?
        .stdout;
    println!("{}", String::from_utf8_lossy(&out));
    Ok(())
}

fn run_batch_command(ctx: &mut DBToolCtx, args: &Vec<String>) -> Fallible<()> {
    let file_path = if args.len() == 0 {
        "config/test_data.txt"
    } else {
        &args[0]
    };
    let txt = fs::read_to_string(file_path).expect("讀取檔案失敗");
    for cmd in txt.split("\n").into_iter() {
        match ctx.get_user()? {
            Some(user) => println!("{} > {}", user.name, cmd),
            _ => println!("> {}", cmd),
        }

        let vec_cmd: Vec<String> = cmd.split(" ").map(|s| s.to_owned()).collect();
        if let Err(e) = dispatch_command(ctx, &vec_cmd[0], &vec_cmd[1..].to_vec()) {
            println!("{:?}", e);
        }
    }
    Ok(())
}

fn exec_command(ctx: &mut DBToolCtx) -> Fallible<CommandResult> {
    let (subcommand, args) = match match_subcommand(ctx)? {
        Some(command) => command,
        None => return Ok(CommandResult::Eof),
    };

    dispatch_command(ctx, &subcommand, &args)
}

fn dispatch_command(
    ctx: &mut DBToolCtx,
    subcommand: &str,
    args: &Vec<String>,
) -> Fallible<CommandResult> {
    match subcommand {
        "help" => println!("{}", HELP_MSG),
        "h" => println!("{}", HELP_MSG),
        "run" => run_batch_command(ctx, &args)?,
        "add" => add_something(ctx, &args)?,
        "as" => as_user(ctx, &args)?,
        "invite" => invite(ctx, &args)?,
        "reset" => reset_database(ctx)?,
        "exit" => return Ok(CommandResult::Eof),
        other => println!("無 {} 指令", other),
    }
    Ok(CommandResult::Success)
}

fn main() -> Fallible<()> {
    // 載入設定
    let args_config = load_yaml!("args.yaml");
    let arg_matches = clap::App::from_yaml(args_config).get_matches();
    let config_file = arg_matches
        .value_of("config_file")
        .map(|p| PathBuf::from(p));
    initialize_config(&config_file);
    let conf = CONFIG.get();

    // 初始化資料庫
    db::init_db(&conf.database.url);

    println!("碳鍵 - 資料庫管理介面\n使用 help 查詢指令");
    let mut ctx = DBToolCtx::new();
    loop {
        match exec_command(&mut ctx) {
            Ok(CommandResult::Success) => {}
            Ok(CommandResult::Eof) => {
                ctx.line_editor.save_history(COMMAND_HISTORY_FILE)?;
                break;
            }
            Err(error) => {
                println!("執行失敗： {}", error);
            }
        }
    }

    Ok(())
}
