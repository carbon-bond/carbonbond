use std::io::{stdin, stdout};
use std::io::Write;

use carbonbond::user::{email, signup};
use carbonbond::forum;
use carbonbond::party;
use carbonbond::db;

static HELP_MSG: &'static str = "
<> 表示必填， [] 表示選填

add 子命令：
    add user <信箱地址> <使用者名稱> <密碼>
    add party <政黨名> [看板名]
        如果不填看板名，會建立流亡政黨
    add board <流亡政黨 id> <看板名>
as 子命令（尚未實作）：
    as <使用者名稱>
        db-tool 會記住你的身份，在執行創黨/發文等等功能時自動填入
invite 子命令：
    invite <信箱地址>
";

fn match_subcommand() -> Result<(String, Vec<String>), failure::Error> {
    print!("> ");
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

fn add_something(args: &Vec<String>) -> Result<(), failure::Error> {
    if args.len() < 2 {
        return Err(failure::format_err!("add 參數數量錯誤"));
    }
    let something = args[0].clone();
    let sub_args = args[1..].to_vec();
    match something.as_ref() {
        "user" => add_user(&sub_args),
        "party" => add_party(&sub_args),
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

fn add_party(args: &Vec<String>) -> Result<(), failure::Error> {
    if args.len() == 1 {
        let party = &args[0];
        let id = party::create_party(&db::connect_db(), None, party)?;
        println!("成功建立政黨，id = {}", id);
        Ok(())
    } else if args.len() == 2 {
        let (party, board) = (&args[0], &args[1]);
        let id = party::create_party_with_board_name(&db::connect_db(), Some(board), party)?;
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
    let id = forum::create_board(&db::connect_db(), party, board)?;
    println!("成功建立看板，id = {}", id);
    Ok(())
}

fn invite(args: &Vec<String>) -> Result<(), failure::Error> {
    let invite_code = signup::create_invitation(&db::connect_db(), None, &args[0])?;
    email::send_invite_email(None, &invite_code, &args[0])?;
    Ok(())
}

fn exec_command() -> Result<(), failure::Error> {
    let (subcommand, args) = match_subcommand()?;
    match subcommand.as_ref() {
        "help" => println!("{}", HELP_MSG),
        "add" => add_something(&args)?,
        "as" => println!("as 子指令未實作"),
        "invite" => invite(&args)?,
        other => println!("無 {} 指令", other),
    }
    Ok(())
}

fn main() {
    println!("碳鍵 - 資料庫管理介面\n使用 help 查詢指令");
    loop {
        match exec_command() {
            Err(error) => {
                println!("執行失敗： {}", error);
            }
            _ => {}
        }
    }
}
