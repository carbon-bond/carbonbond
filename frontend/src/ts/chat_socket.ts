import { List } from 'immutable';
import { AllChatState, DirectChatData, Message } from '../tsx/global_state/chat';
import { toastErr } from '../tsx/utils';
import { ChatAPI, InitInfo, MessageSending } from './api/api_trait';

export class ChatSocket {
	socket: WebSocket | null;
	all_chat: AllChatState | null;
	mapping: Map<number, string>;
	constructor() {
		this.all_chat = null;
		this.socket = null;
		this.mapping = new Map();
		console.log('構造 chat socket');
	}
	set_all_chat(all_chat: AllChatState): void {
		this.all_chat = all_chat;
		if (this.socket == null) {
			const url = `ws://${window.location.hostname}:${window.location.port}/chat`;
			this.socket = new WebSocket(url);
			this.socket.onopen = () => { };
			this.socket.onmessage = (event) => {
				const api: any = JSON.parse(event.data);
				console.log(`from server: ${event.data}`);
				if (api.InitInfo) {
					console.log('init info');
					let init_info: InitInfo = api.InitInfo;
					for (const channel of init_info.channels) {
						if ('Direct' in channel) {
							const chat = channel.Direct;
							console.log(chat);
							this.mapping.set(chat.channel_id, chat.name);
							this.all_chat!.addDirectChat(chat.name, new DirectChatData({
								history: List<Message>([
									new Message(
										chat.last_msg.sender_name,
										chat.last_msg.text,
										new Date(chat.last_msg.time),
									)
								]),
								name: chat.name,
								id: chat.channel_id,
							}));
						}
					}
				} else {
					console.log('message sending');
					let message_sending: MessageSending = api;
					console.log(`${JSON.stringify(message_sending)}`);
					let sender = this.mapping.get(message_sending.channel_id);
					if (sender == undefined) {
						toastErr(`找不到聊天室：${message_sending.channel_id}`);
					} else {
						// TODO: 使用伺服器傳回的日期
						this.all_chat!.addMessage(sender, new Message(message_sending.content, sender, new Date()));
					}
				}
			};
		}
	}
	send_message(channel_id: number, content: string): void {
		this.socket!.send(JSON.stringify({channel_id, content}));
	}
}
