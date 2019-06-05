use crate::db;
use std::env;

use diesel::pg::PgConnection;
pub fn send_invite_email(conn: &PgConnection, sender: Option<&str>, recv: &str) {
    use rand::Rng;
    use rand::distributions::Alphanumeric;
    use std::process::Command;

    let invite_code: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .collect();
    db::create_invitation(conn, recv, &invite_code);

    dotenv::dotenv().ok();
    let mailgun_api_key = env::var("MAILGUN_API_KEY").expect("未設置 mailgun api key");
    let inviter_name = {
        if let Some(name) = &sender {
            &name
        } else {
            "系統管理員"
        }
    };
    let url = format!("http://carbon-bond.com/app/register/{}", invite_code);
    let welcome_title = "您已受邀加入碳鍵";
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎！{} 已推薦您加入碳鍵</h1> \
         <p>請點選以下連結，開始你的碳鍵生活。</p> \
         <a href=\"{}\">{}</a> <br/> \
         <p>提高你的鍵能，嘴爆那些笨蛋吧！</p> \
         </html>",
        inviter_name, url, url
    );

    let cmd = format!(
        "curl -s --user 'api:{}' \
         https://api.mailgun.net/v3/mail.carbon-bond.com/messages \
         -F from='碳鍵 <noreply@mail.carbon-bond.com>' \
         -F to='{}' \
         -F subject='{}' \
         -F text='{}' \
         --form-string html='{}'",
        mailgun_api_key, recv, welcome_title, welcome_title, welcome_msg
    );
    let output = Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .output()
        .expect("寄信失敗");
    let msg: String = output.stdout.iter().map(|ch| *ch as char).collect();
    println!("{}", msg);
}