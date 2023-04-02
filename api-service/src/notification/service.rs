use tokio::sync::Mutex;

use tokio::sync::mpsc;

use crate::api::model::forum::Webhook;
use crate::api::model::webhook::API;
use crate::custom_error;
use crate::db::user;

use hmac::{Hmac, Mac};
use reqwest::header::{HeaderMap, HeaderValue};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub struct NotificationService {
    sender: Mutex<mpsc::Sender<Request>>,
}

struct Request {
    target_id: i64,
    api: API,
}

async fn send_http_request(request: &Request, webhook: Webhook) -> Result<(), custom_error::Error> {
    let payload = serde_json::to_string(&request.api)?;

    // 計算 HMAC
    let mut mac = HmacSha256::new_from_slice(webhook.secret.as_bytes()).unwrap();
    mac.update(payload.as_bytes());
    let hmac = mac.finalize().into_bytes();

    // 轉換為十六進制字串
    let hmac_hex = hex::encode(hmac);

    let client = reqwest::Client::new();

    let mut headers = HeaderMap::new();
    headers.insert("Content-Type", HeaderValue::from_static("application/json"));
    headers.insert("HMAC", HeaderValue::from_str(&hmac_hex)?);
    client
        .post(webhook.target_url)
        .headers(headers)
        .body(payload)
        .send()
        .await?;
    Ok(())
}

async fn send_to_webhook_url(request: Request) -> Result<(), custom_error::Error> {
    let webhooks = user::query_webhooks(request.target_id).await?;
    // TODO: 若有效能問題，可改為平行發送請求 HTTP
    for webhook in webhooks {
        log::info!("發送 webhook 到 {}", webhook.target_url);
        send_http_request(&request, webhook).await?;
    }
    Ok(())
}

const NOTIFICATION_SERVICE_CHANNEL_SIZE: usize = 10;

impl NotificationService {
    pub async fn new() -> Self {
        let (sender, mut receiver) = mpsc::channel::<Request>(NOTIFICATION_SERVICE_CHANNEL_SIZE);
        tokio::task::spawn(async move {
            loop {
                match receiver.recv().await {
                    Some(request) => {
                        tokio::task::spawn(async move {
                            log::info!(
                                "通知服務收到請求，送到 {}, 內容：{:?}",
                                request.target_id,
                                request.api
                            );
                            match send_to_webhook_url(request).await {
                                Err(err) => {
                                    log::warn!("{}", err);
                                }
                                Ok(()) => {}
                            }
                        });
                    }
                    None => {
                        log::warn!("通知服務接收端關閉");
                        break;
                    }
                }
            }
        });

        NotificationService {
            sender: Mutex::new(sender),
        }
    }
    pub async fn send(&self, target_id: i64, api: API) {
        let tx = self.sender.lock().await;
        match tx.send(Request { target_id, api }).await {
            Ok(()) => {}
            Err(err) => {
                log::warn!("通知服務發送端錯誤 {}", err);
            }
        }
    }
}
