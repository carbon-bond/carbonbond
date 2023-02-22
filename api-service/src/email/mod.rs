mod mailgun;
mod smtp;
use crate::config::get_config;
use crate::config::EmailDriver;
use crate::custom_error::Fallible;

async fn send_via_log(
    sender: &str,
    receiver: &str,
    subject: &str,
    html_content: &str,
) -> Fallible<()> {
    log::info!("寄件者：{}", sender);
    log::info!("收件者：{}", receiver);
    log::info!("主旨：{}", subject);
    log::info!("內文：{}", html_content);
    Ok(())
}

async fn send_html_email(receiver: &str, subject: &str, html_content: String) -> Fallible<()> {
    let config = get_config();
    let receiver = match &config.email.fake_receiver {
        Some(fake_receiver) => fake_receiver.as_str(),
        None => receiver,
    };
    let sender = config.email.from.as_str();
    let domain = config.email.domain.as_str();
    match &config.email.driver {
        EmailDriver::Log => send_via_log(sender, receiver, subject, &html_content).await,
        EmailDriver::Mailgun { mailgun_api_key } => {
            mailgun::send_via_mailgun(
                sender,
                domain,
                receiver,
                subject,
                &html_content,
                mailgun_api_key,
            )
            .await
        }
        EmailDriver::SMTP {
            smtp_username,
            smtp_password,
        } => {
            smtp::send_via_smtp(
                sender,
                receiver,
                subject,
                html_content,
                smtp_username,
                smtp_password,
            )
            .await
        }
    }
}

pub async fn send_signup_email(token: &str, receiver: &str) -> Fallible<()> {
    log::debug!("對 {} 寄發註冊確認信", receiver);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/signup/{}", base_url, token);
    let subject = format!("歡迎您註冊碳鍵");
    let welcome_msg = format!(
        "<html> \
         <h1>歡迎加入碳鍵！</h1> \
         <p>點選以下連結，一起嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        url, url
    );

    log::debug!("邀請註冊網址： {}", url);

    send_html_email(receiver, &subject, welcome_msg).await
}

pub async fn send_invitation_email(
    token: &str,
    receiver: &str,
    inviter_name: String,
) -> Fallible<()> {
    log::debug!("{} 對 {} 寄發邀請信", inviter_name, receiver);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/signup/{}", base_url, token);
    let subject = format!("{} 邀請您加入碳鍵", inviter_name);
    let html_content = format!(
        "<html> \
         <h1>歡迎加入碳鍵！</h1> \
         <p>點選以下連結，和 {} 一起嘴爆那些笨蛋吧！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        inviter_name, url, url
    );
    log::debug!("邀請註冊網址： {}", url);

    send_html_email(receiver, &subject, html_content).await
}

pub async fn send_reset_password_email(token: &str, receiver: &str) -> Fallible<()> {
    log::debug!("給 {} 寄發重置密碼信", receiver);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/reset_password/{}", base_url, token);
    let subject = format!("重置碳鍵密碼");
    let html_content = format!(
        "<html> \
         <p>點選以下連結，即時重返戰場！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        url, url
    );
    log::debug!("重置密碼網址： {}", url);

    send_html_email(receiver, &subject, html_content).await
}

pub async fn send_change_email_email(token: &str, receiver: &str) -> Fallible<()> {
    log::debug!("給 {} 寄發更換信箱信", receiver);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/change_email/{}", base_url, token);
    let subject = format!("更換碳鍵電子信箱");
    let html_content = format!(
        "<html> \
         <p>點選以下連結，奔向新的藏身處！</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        url, url
    );
    log::debug!("更換信箱網址： {}", url);

    send_html_email(receiver, &subject, html_content).await
}

pub async fn send_claim_title_email(
    token: &str,
    receiver: &str,
    title: &str,
    license_id: &str,
) -> Fallible<()> {
    log::debug!("對 {} 寄發稱號驗證信", receiver);
    let base_url = &get_config().server.base_url;
    let url = format!("{}/app/verify_title/{}", base_url, token);
    let subject = format!("驗證 {} 稱號", title);
    let html_content = format!(
        "<html> \
         <p>點選以下連結，以驗證你宣稱的 {} 稱號，唯一識別字 {}</p> \
         <a href=\"{}\">{}</a> <br/> \
         </html>",
        title, license_id, url, url
    );

    log::debug!("稱號驗證網址： {}", url);

    send_html_email(receiver, &subject, html_content).await
}
