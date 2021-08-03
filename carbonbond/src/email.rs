use crate::config::get_config;
use crate::custom_error::{Contextable, Fallible};
use std::process::Command;

// XXX: 這會不會堵住線程？
fn send_html_email(recv_email: &str, title: &str, html_content: &str) -> Fallible<String> {
    let mailgun_api_key = &get_config().server.mailgun_api_key;
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
        .context("寄信失敗")?;

    let msg: String = output.stdout.iter().map(|ch| *ch as char).collect();
    return Ok(msg);
}

pub fn send_signup_email(token: &str, recv_email: &str) -> Fallible<()> {
    log::debug!("對 {} 寄發邀請信", recv_email);
    let url = format!("http://carbon-bond.com/app/signup/{}", token);
    let welcome_title = format!("您註冊碳鍵囉^Q^");
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎加入碳鍵！</h1> \
         <p>點選以下連結，嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        url, url
    );

    let ret_msg = send_html_email(recv_email, &welcome_title, &welcome_msg)?;
    log::debug!("寄信回傳訊息：{}", ret_msg);
    Ok(())
}
