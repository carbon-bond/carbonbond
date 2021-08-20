use crate::config::get_config;
use crate::custom_error::{Error, Fallible};
use reqwest;
use std::collections::HashMap;

async fn send_html_email(
    email_address: &str,
    subject: &str,
    html_content: &str,
) -> Fallible<String> {
    let mailgun_api_key = get_config().server.mailgun_api_key.as_str();
    let mail_from = get_config().server.mail_from.as_str();
    let mail_domain = get_config().server.mail_domain.as_str();
    let mut form = HashMap::new();
    form.insert("from", mail_from);
    form.insert("to", email_address);
    form.insert("subject", subject);
    form.insert("html", html_content);
    let url = format!(
        "https://api:{}@api.mailgun.net/v3/{}/messages",
        mailgun_api_key, mail_domain
    );
    let response = reqwest::Client::new().post(url).form(&form).send().await?;

    if response.status().is_success() {
        Ok(response.text().await?)
    } else {
        Err(Error::new_internal(response.text().await?))
    }
}

pub async fn send_signup_email(token: &str, email_address: &str) -> Fallible<()> {
    log::debug!("對 {} 寄發註冊確認信", email_address);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/signup/{}", base_url, token);
    let subject = format!("您註冊碳鍵囉^Q^");
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
    log::debug!("主旨：{}", subject);
    log::debug!("內文：{}", welcome_msg);

    let ret_msg = send_html_email(email_address, &subject, &welcome_msg).await?;
    log::debug!("寄信回傳訊息：{}", ret_msg);
    Ok(())
}

pub async fn send_invitation_email(
    token: &str,
    email_address: &str,
    inviter_name: String,
) -> Fallible<()> {
    log::debug!("{} 對 {} 寄發邀請信", inviter_name, email_address);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/signup/{}", base_url, token);
    let subject = format!("{} 邀請您加入碳鍵", inviter_name);
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
    log::debug!("主旨：{}", subject);
    log::debug!("內文：{}", welcome_msg);

    let ret_msg = send_html_email(email_address, &subject, &welcome_msg).await?;
    log::debug!("寄信回傳訊息：{}", ret_msg);
    Ok(())
}
