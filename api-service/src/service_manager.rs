use crate::chat::service::ChatService;
use crate::notification::service::NotificationService;

pub struct ServiceManager {
    pub notification_service: NotificationService,
    pub chat_service: ChatService,
}

impl ServiceManager {
    pub async fn new() -> Self {
        ServiceManager {
            notification_service: NotificationService::new().await,
            chat_service: ChatService::default(),
        }
    }
}
