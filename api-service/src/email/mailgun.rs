use crate::custom_error::{Error, Fallible};
use reqwest;
use std::collections::HashMap;

pub async fn send_via_mailgun(
    sender: &str,
    domain: &str,
    receiver: &str,
    subject: &str,
    html_content: &str,
    mailgun_api_key: &str,
) -> Fallible<()> {
    let mut form = HashMap::new();
    form.insert("from", sender);
    form.insert("to", receiver);
    form.insert("subject", subject);
    form.insert("html", html_content);
    let url = format!(
        "https://api:{}@api.mailgun.net/v3/{}/messages",
        mailgun_api_key, domain
    );
    let response = reqwest::Client::new().post(url).form(&form).send().await?;
    let is_success = response.status().is_success();

    let ret_msg = &response.text().await?;
    log::debug!("mailgun 寄信回傳訊息：{}", ret_msg);

    if is_success {
        Ok(())
    } else {
        Err(Error::new_internal(ret_msg))
    }
}
