use std::env;
use std::process::Command;
use failure::Fallible;
use crate::custom_error::InternalError;

fn send_html_email(recv_email: &str, title: &str, html_content: &str) -> Fallible<String> {
    dotenv::dotenv().ok();
    // TODO 使用設定檔載入 MAILGUN_API_KEY
    let mailgun_api_key = env::var("MAILGUN_API_KEY").expect("未設置 mailgun api key");
    // TODO: text 能否拿掉？
    let cmd = format!(
        "curl -s --user 'api:{}' \
         https://api.mailgun.net/v3/mail.carbon-bond.com/messages \
         -F from='碳鍵 <noreply@mail.carbon-bond.com>' \
         -F to='{}' \
         -F subject='{}' \
         --form-string html='{}'",
        mailgun_api_key, recv_email, title, html_content
    );

    let output = Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .output()
        .map_err(|e| InternalError::new(&format!("寄信失敗: {}", e)))?;

    let msg: String = output.stdout.iter().map(|ch| *ch as char).collect();
    return Ok(msg);
}

pub fn send_invite_email(
    sender_id: Option<&str>,
    invite_code: &str,
    recv_email: &str,
) -> Fallible<()> {
    let inviter_id = {
        if let Some(id) = &sender_id {
            &id
        } else {
            "系統管理員"
        }
    };
    let url = format!("http://carbon-bond.com/app/register/{}", invite_code);
    let welcome_title = format!("{} 邀請您加入碳鍵", inviter_id);
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎加入碳鍵！</h1> \
         <p>點選以下連結，嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        url, url
    );

    println!(
        "寄邀請信回應 {}",
        send_html_email(recv_email, &welcome_title, &welcome_msg)?
    );

    Ok(())
}
