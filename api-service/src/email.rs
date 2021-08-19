use crate::config::get_config;
use crate::custom_error::{Contextable, Fallible};
use tokio::process::Command;

async fn send_html_email(recv_email: &str, title: &str, html_content: &str) -> Fallible<String> {
    let mailgun_api_key = &get_config().server.mailgun_api_key;
    let mail_from = &get_config().server.mail_from;
    let mail_domain = &get_config().server.mail_domain;
    // TODO: 改以 hyper 打 API 以知曉更明確結果
    // 例如以 200 OK 來判斷成功寄出
    let cmd = format!(
        "curl -s --user 'api:{}' \
         https://api.mailgun.net/v3/{}/messages \
         -F from='{}' \
         -F to='{}' \
         -F subject='{}' \
         --form-string html='{}'",
        mailgun_api_key, mail_domain, mail_from, recv_email, title, html_content
    );

    let output = Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .output()
        .await
        .context("寄信失敗")?;

    let msg: String = output.stdout.iter().map(|ch| *ch as char).collect();
    return Ok(msg);
}

pub async fn send_signup_email(token: &str, recv_email: &str) -> Fallible<()> {
    log::debug!("對 {} 寄發註冊確認信", recv_email);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/signup/{}", base_url, token);
    let welcome_title = format!("您註冊碳鍵囉^Q^");
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎加入碳鍵！</h1> \
         <p>點選以下連結，一起嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        url, url
    );

    log::debug!("寄信");
    log::debug!("url： {}", url);
    log::debug!("標題：{}", welcome_title);
    log::debug!("內文：{}", welcome_msg);

    let ret_msg = send_html_email(recv_email, &welcome_title, &welcome_msg).await?;
    log::debug!("寄信回傳訊息：{}", ret_msg);
    Ok(())
}

pub async fn send_invitation_email(
    token: &str,
    recv_email: &str,
    inviter_name: String,
) -> Fallible<()> {
    log::debug!("{} 對 {} 寄發邀請信", inviter_name, recv_email);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/signup/{}", base_url, token);
    let welcome_title = format!("{} 邀請您加入碳鍵", inviter_name);
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎加入碳鍵！</h1> \
         <p>點選以下連結，和 {} 一起嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        inviter_name, url, url
    );
    log::debug!("寄信");
    log::debug!("url： {}", url);
    log::debug!("標題：{}", welcome_title);
    log::debug!("內文：{}", welcome_msg);

    let ret_msg = send_html_email(recv_email, &welcome_title, &welcome_msg).await?;
    log::debug!("寄信回傳訊息：{}", ret_msg);
    Ok(())
}
