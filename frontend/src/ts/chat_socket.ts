export class ChatSocket {
	socket: WebSocket;
	constructor() {
		const url = `ws://${window.location.hostname}:${window.location.port}/chat`;
		this.socket = new WebSocket(url);
		this.socket.onopen = () => { };
		this.socket.onmessage = (event) => {
			console.log(`from server: ${event.data}`);
		};
	}
	send_message(channel_id: number, content: string): void {
		this.socket.send(JSON.stringify({channel_id, content}));
	}
}
