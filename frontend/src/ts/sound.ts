import message_notification_url from '../sound/message-notification.mp3';

export function play_message_notification(): void {
	const audio = new Audio(message_notification_url);
	audio.play();
}