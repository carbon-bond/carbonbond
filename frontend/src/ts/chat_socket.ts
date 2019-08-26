import { chat_proto } from './protobuf/chat_proto.js';

const {
	ClientSendMeta,
	Direction,
	Send,
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
			const send = Send.create({
				directReceiverId: 0,
				content: '大力金剛掌'
			});
			const buf1 = ClientSendMeta.encodeDelimited(meta).finish();
			console.log(buf1);
			const buf2 = Send.encodeDelimited(send).finish();
			console.log(buf2);
			const msg = new Uint8Array(buf1.length + buf2.length);
			msg.set(buf1);
			msg.set(buf2, buf1.length);
			console.log(msg);
			this.socket.send(msg);
		};
		this.socket.onmessage = (event) => {
			console.log(`from server: ${event.data}`);
		};
	}
}

export {
	ChatSocket
};