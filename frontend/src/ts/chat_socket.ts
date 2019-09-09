import { chat_proto } from './protobuf/chat_proto.js';

const {
	ClientSendData,
} = chat_proto;

class ChatSocket {
	socket: WebSocket;
	id: number;
	opened: Promise<void>;
	constructor(id: number) {
		const url = `ws://${window.location.hostname}:${window.location.port}/ws`;
		this.id = id;
		this.socket = new WebSocket(url);
		this.opened = new Promise((resolve, reject) => {
			console.log('connecting');
			this.socket.onopen = () => {
				const data = ClientSendData.create({
					id: 0,
					recentChat: {
						beforeTime: (new Date()).getTime(),
						number: 20
					}
				});
				const buf = ClientSendData.encodeDelimited(data).finish();
				this.socket.send(buf);
				resolve();
			};
			this.socket.onerror = function (err) {
				reject(err);
			};
			this.socket.binaryType = 'arraybuffer';
		});
	}
	setHandler(onmessage: (this: WebSocket, ev: MessageEvent) => void): void {
		this.socket.onmessage = onmessage;
	}
	send(buf: Uint8Array): void {
		this.opened.then(() => {
			this.socket.send(buf);
		});
	}
}

export {
	ChatSocket
};