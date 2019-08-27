import { chat_proto } from './protobuf/chat_proto.js';

const {
	ClientSendData,
} = chat_proto;

class ChatSocket {
	socket: WebSocket;
	id: number;
	constructor(id: number) {
		const url = `ws://${window.location.hostname}:${window.location.port}/ws`;
		this.id = id;
		this.socket = new WebSocket(url);
	}
	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.socket.onopen = () => {
				const data = ClientSendData.create({
					id: this.id,
					send: {
						directReceiverId: 0,
						content: '大力金剛掌'
					}
				});
				const buf = ClientSendData.encodeDelimited(data).finish();
				this.socket.send(buf);
				resolve();
			};
			this.socket.onerror = function (err) {
				reject(err);
			};
			this.socket.onmessage = (event) => {
				console.log(`from server: ${event.data}`);
			};
		});
	}
}

export {
	ChatSocket
};