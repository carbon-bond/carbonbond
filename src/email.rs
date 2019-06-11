use std::env;
use std::process::Command;
use diesel::pg::PgConnection;
use crate::signup;

pub fn send_invite_email(
    conn: &PgConnection,
    sender_id: Option<&str>,
    recv_email: &str,
) -> Option<()> {
    let invite_code = match signup::create_invitation(conn, sender_id, recv_email) {
        Some(code) => code,
        None => return Some(()),
    };

    dotenv::dotenv().ok();
    let mailgun_api_key = env::var("MAILGUN_API_KEY").expect("未設置 mailgun api key");
    let inviter_id = {
        if let Some(id) = &sender_id {
            &id
        } else {
            "系統管理員"
        }
    };
    let url = format!("http://carbon-bond.com/app/register/{}", invite_code);
    let welcome_title = "您已受邀加入碳鍵";
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎！{} 推薦您加入碳鍵</h1> \
         <p>請點選以下連結，嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        inviter_id, url, url
    );

    let cmd = format!(
        "curl -s --user 'api:{}' \
         https://api.mailgun.net/v3/mail.carbon-bond.com/messages \
         -F from='碳鍵 <noreply@mail.carbon-bond.com>' \
         -F to='{}' \
         -F subject='{}' \
         -F text='{}' \
         --form-string html='{}'",
        mailgun_api_key, recv_email, welcome_title, welcome_title, welcome_msg
    );
    let output = Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .output()
        .expect("寄信失敗");
    let msg: String = output.stdout.iter().map(|ch| *ch as char).collect();
    println!("寄邀請信回應 {}", msg);
    None
}
