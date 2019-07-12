use std::io::{stdin, stdout};
use std::io::Write;

use diesel::PgConnection;

use carbonbond::Context;
use carbonbond::user::{email, signup, find_user};
use carbonbond::forum;
use carbonbond::party;
use carbonbond::db;
use carbonbond::custom_error::Error;

static HELP_MSG: &'static str = "
<> 表示必填， [] 表示選填

add 子命令：
    add user <信箱地址> <使用者名稱> <密碼>
    add party <政黨名> [看板名]
        如果不填看板名，會建立流亡政黨
    add board <流亡政黨 id> <看板名>
as 子命令：
    as <使用者名稱>
        db-tool 會記住你的身份，在執行創黨/發文等等功能時自動填入
invite 子命令：
    invite <信箱地址>
";

struct DBToolCtx {
    conn: PgConnection,
    id: Option<String>,
}
impl Context for DBToolCtx {
    fn use_pg_conn<T, F: FnMut(&PgConnection) -> T>(&self, mut callback: F) -> T {
        callback(&self.conn)
    }
    fn remember_id(&self, id: String) -> Result<(), Error> {
        let _s = self as *const Self as *mut Self;
        unsafe {
            (*_s).id = Some(id);
        }
        Ok(())
    }
    fn forget_id(&self) -> Result<(), Error> {
        unimplemented!();
    }
    fn get_id(&self) -> Option<String> {
        self.id.clone()
    }
}

fn match_subcommand(ctx: &DBToolCtx) -> Result<(String, Vec<String>), failure::Error> {
    match ctx.get_id() {
        Some(id) => print!("{} > ", id),
        _ => print!("> "),
    }
    stdout().flush()?;
    let mut buff = String::new();
    loop {
        stdin().read_line(&mut buff)?;
        let words: Vec<String> = buff.split_whitespace().map(|w| w.to_owned()).collect();
        if words.len() == 0 {
            continue;
        }
        return Ok((words[0].clone(), words[1..].to_vec()));
    }
}

fn add_something(ctx: &DBToolCtx, args: &Vec<String>) -> Result<(), failure::Error> {
    if args.len() < 2 {
        return Err(failure::format_err!("add 參數數量錯誤"));
    }
    let something = args[0].clone();
    let sub_args = args[1..].to_vec();
    match something.as_ref() {
        "user" => add_user(&sub_args),
        "party" => add_party(ctx, &sub_args),
        "board" => add_board(&sub_args),
        other => Err(failure::format_err!("無法 add {}", other)),
    }
}

fn add_user(args: &Vec<String>) -> Result<(), failure::Error> {
    if args.len() != 3 {
        return Err(failure::format_err!("add user 參數數量錯誤"));
    }
    let (email, id, password) = (&args[0], &args[1], &args[2]);
    // TODO: create_user 內部要做錯誤處理
    signup::create_user(&db::connect_db(), email, id, password);
    Ok(())
}

fn add_party(ctx: &DBToolCtx, args: &Vec<String>) -> Result<(), failure::Error> {
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
        Err(failure::format_err!("add party 參數數量錯誤"))
    }
}

fn add_board(args: &Vec<String>) -> Result<(), failure::Error> {
    if args.len() != 2 {
        return Err(failure::format_err!("add board 參數數量錯誤"));
    }
    let (party, board) = (args[0].parse::<i64>()?, &args[1]);
    let id = forum::operation::create_board(&db::connect_db(), party, board)?;
    println!("成功建立看板，id = {}", id);
    Ok(())
}

fn invite(args: &Vec<String>) -> Result<(), failure::Error> {
    let invite_code = signup::create_invitation(&db::connect_db(), None, &args[0])?;
    email::send_invite_email(None, &invite_code, &args[0])?;
    Ok(())
}
fn as_user(ctx: &mut DBToolCtx, args: &Vec<String>) -> Result<(), failure::Error> {
    let id = args[0].clone();
    find_user(&ctx.conn, &id)?;
    ctx.remember_id(id).unwrap();
    Ok(())
}

fn exec_command(ctx: &mut DBToolCtx) -> Result<(), failure::Error> {
    let (subcommand, args) = match_subcommand(ctx)?;
    match subcommand.as_ref() {
        "help" => println!("{}", HELP_MSG),
        "h" => println!("{}", HELP_MSG),
        "add" => add_something(ctx, &args)?,
        "as" => as_user(ctx, &args)?,
        "invite" => invite(&args)?,
        other => println!("無 {} 指令", other),
    }
    Ok(())
}

fn main() {
    println!("碳鍵 - 資料庫管理介面\n使用 help 查詢指令");
    let mut ctx = DBToolCtx {
        conn: db::connect_db(),
        id: None,
    };
    loop {
        match exec_command(&mut ctx) {
            Err(error) => {
                println!("執行失敗： {}", error);
            }
            _ => {}
        }
    }
}
