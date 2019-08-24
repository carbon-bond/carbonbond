import { chat_proto } from './protobuf/chat_proto.js';

const {
	ClientSendMeta,
	Direction
} = chat_proto;

class ChatSocket {
	socket: WebSocket;
	constructor() {
		const url = `ws://${window.location.hostname}:${window.location.port}/ws`;
		this.socket = new WebSocket(url);
		this.socket.onopen = () => {
			this.socket.send('hi');
			const meta = ClientSendMeta.create({
				id: 2,
				direction: Direction.REQUEST,
				type: ClientSendMeta.Type.SEND
			});
			const buffer = ClientSendMeta.encode(meta).finish();
			this.socket.send(buffer);
		};
		this.socket.onmessage = (event) => {
			console.log(`from server: ${event.data}`);
		};
	}
}

export {
	ChatSocket
};