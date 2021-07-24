export class ChatSocket {
	socket: WebSocket;
	constructor() {
		const url = `ws://${window.location.hostname}:${window.location.port}/chat`;
		this.socket = new WebSocket(url);
		this.socket.onopen = () => {
			this.socket.send('Hi~Hi~ Using websocket!!!');
		};
		this.socket.onmessage = (event) => {
			console.log(`from server: ${event.data}`);
		};
	}
}
