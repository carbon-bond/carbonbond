import { AllChatState, DirectChatData, Message } from '../tsx/global_state/chat';
import { toastErr } from '../tsx/utils';
import { server_trigger, MessageSending } from './api/api_trait';

export class ChatSocket {
	socket: WebSocket | null;
	all_chat: AllChatState | null;
	constructor() {
		this.all_chat = null;
		this.socket = null;
	}
	init(all_chat: AllChatState): void {
		console.log('初始化 chat socket');
		this.set_all_chat(all_chat);
		this.reset();
	}
	close(): void {
		console.log('關閉 chat socket');
		this.socket?.close();
		this.socket = null;
		this.all_chat = null;
	}
	reset(): void {
		const url = `ws://${window.location.hostname}:${window.location.port}/chat`;
		this.socket = new WebSocket(url);
		this.socket.onopen = () => { };
		this.socket.onmessage = (event) => {
			// XXX: 使用 server_trigger.API
			// eslint-disable-next-line
			const api: any = JSON.parse(event.data);
			console.log(`from server: ${event.data}`);
			if (api.InitInfo) {
				console.log('init info');
				let init_info: server_trigger.InitInfo = api.InitInfo;
				for (const channel of init_info.channels) {
					if ('Direct' in channel) {
						const chat = channel.Direct;
						console.log(chat);
						this.all_chat!.addDirectChat(chat.channel_id, new DirectChatData(
							chat.name,
							chat.channel_id,
							chat.opposite_id,
							[
								new Message(
									chat.last_msg.id,
									chat.last_msg.sender,
									chat.last_msg.text,
									new Date(chat.last_msg.time),
								)
							],
							new Date(chat.read_time),
							true
						));
					}
				}
			} else {
				console.log('message sending');
				let message_sending: MessageSending = api;
				console.log(`${JSON.stringify(message_sending)}`);
				if (this.all_chat == undefined) {
					console.log('all_chat 尚未載入');
				} else if (this.all_chat.all_chat.direct[message_sending.channel_id]) {
					// TODO: 使用伺服器傳回的日期、訊息 id
					this.all_chat.addMessage(message_sending.channel_id, new Message(-1, server_trigger.Sender.Opposite, message_sending.content, new Date()));
				} else {
					// XXX: 如果初始化的時候沒有載入這個頻道（初始化的時候很可能不會載入所有頻道，僅會載入最近活躍的頻道），就會找不到聊天室
					toastErr(`找不到聊天室：${message_sending.channel_id}`);
				}
			}
		};

	}
	set_all_chat(all_chat: AllChatState): void {
		this.all_chat = all_chat;
	}
	send_message(channel_id: number, content: string): void {
		this.socket!.send(JSON.stringify({ channel_id, content }));
	}
}
