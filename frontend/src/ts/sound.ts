export function play_message_notification(): void {
	const audio = new Audio('message-notification.mp3');
	audio.play();
}