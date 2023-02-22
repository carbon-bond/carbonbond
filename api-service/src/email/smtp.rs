use crate::custom_error::{Error, Fallible};
use lettre::{
    message::header::ContentType, transport::smtp::authentication::Credentials, AsyncSmtpTransport,
    AsyncTransport, Message, Tokio1Executor,
};

pub async fn send_via_smtp(
    sender: &str,
    receiver: &str,
    subject: &str,
    html_content: String,
    smtp_username: &str,
    smtp_password: &str,
) -> Fallible<()> {
    let email = Message::builder()
        .from(sender.parse().unwrap())
        .to(receiver.parse().unwrap())
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(html_content)
        .unwrap();

    let creds = Credentials::new(smtp_username.to_owned(), smtp_password.to_owned());

    let mailer: AsyncSmtpTransport<Tokio1Executor> =
        AsyncSmtpTransport::<Tokio1Executor>::relay("smtp.mailgun.org")
            .unwrap()
            .credentials(creds)
            .build();

    match mailer.send(email).await {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::new_internal(format!("{:?}", e))),
    }
}
