use crate::chat::service::ChatService;
use crate::notification::service::NotificationService;

#[derive(Default)]
pub struct ServiceManager {
    pub notification_service: NotificationService,
    pub chat_service: ChatService,
}
