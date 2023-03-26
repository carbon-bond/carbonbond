use tokio::sync::Mutex;

use std::sync::mpsc;

use crate::api::model::webhook::API;

pub struct NotificationService {
    sender: Mutex<mpsc::Sender<Request>>,
}

struct Request {
    target_id: i64,
    api: API,
}

impl NotificationService {
    pub async fn new() -> Self {
        let (sender, receiver) = mpsc::channel::<Request>();
        tokio::task::spawn(async move {
            loop {
                match receiver.recv() {
                    Ok(request) => {
                        log::info!(
                            "通知服務收到請求，送到 {}, 內容：{:?}",
                            request.target_id,
                            request.api
                        );
                    }
                    Err(err) => {
                        log::warn!("通知服務接收端錯誤 {}", err);
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
        match tx.send(Request { target_id, api }) {
            Ok(()) => {}
            Err(err) => {
                log::warn!("通知服務發送端錯誤 {}", err);
            }
        }
    }
}
