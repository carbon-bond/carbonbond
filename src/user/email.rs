use std::process::Command;
use diesel::{prelude::*, pg::PgConnection};
use crate::custom_error::{Error, Fallible};
use crate::config::CONFIG;

fn send_html_email(recv_email: &str, title: &str, html_content: &str) -> Fallible<String> {
    let config = CONFIG.get();
    let mailgun_api_key: &str = &config.server.mailgun_api_key;
    let cmd = format!(
        "curl -s --user 'api:{}' \
         https://api.mailgun.net/v3/{}/messages \
         -F from='{}' \
         -F to='{}' \
         -F subject='{}' \
         --form-string html='{}'",
        mailgun_api_key,
        config.server.mail_domain,
        config.server.mail_from,
        recv_email,
        title,
        html_content
    );

    let output = Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .output()
        .map_err(|e| Error::new_internal("寄信操作失敗", e))?;

    let msg: String = output.stdout.iter().map(|ch| *ch as char).collect();
    return Ok(msg);
}

pub fn send_invite_email(
    conn: &PgConnection,
    sender_id: Option<i64>,
    invite_code: &str,
    recv_email: &str,
    invitation_words: &str,
) -> Fallible<()> {
    let config = CONFIG.get();
    use crate::db::schema::users;

    let inviter_name = {
        if let Some(id) = sender_id {
            users::table
                .select(users::name)
                .find(id)
                .first::<String>(conn)
                .or(Err(Error::new_logic(&format!("找不到使用者: {}", id), 401)))?
        } else {
            "系統管理員".to_owned()
        }
    };
    let url = format!("{}/app/register/{}", config.server.base_url, invite_code);
    let welcome_title = format!("{} 邀請您加入碳鍵", inviter_name);
    let welcome_msg = format!(
        r#"<html>
         <h1>歡迎加入碳鍵！</h1>
         <p>點選以下連結，嘴爆那些笨蛋吧！</p>
         <a href="{}">{}</a> <br/>
         <blockquote>{}</blockquote>
         </html>"#,
        url, url, invitation_words
    );

    println!(
        "寄邀請信回應 {}",
        send_html_email(recv_email, &welcome_title, &welcome_msg)?
    );

    Ok(())
}
