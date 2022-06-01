import { toast } from 'react-toastify';
import { AllChatState, OppositeKind, DirectChatData, Message } from '../tsx/global_state/chat';
import { toastErr } from '../tsx/utils';
import { server_trigger, MessageSending, client_trigger } from './api/api_trait';
import { play_message_notification } from './sound';

const MAX_ATTEMPT_TIMES = 3;

function to_history(message: server_trigger.Message): Message[] {
	return [
		new Message(
			message.id,
			message.sender,
			message.text,
			new Date(message.time),
		)
	];
}

export class ChatSocket {
	socket: WebSocket | null;
	all_chat: AllChatState | null;
	attempt_counter: number;
	constructor() {
		this.all_chat = null;
		this.socket = null;
		this.attempt_counter = 0;
	}
	init(all_chat: AllChatState): void {
		console.log('初始化 chat socket');
		this.set_all_chat(all_chat);
		this.reset();
	}
	close(): void {
		console.log('關閉 chat socket');
		if (this.socket) {
			this.socket.onclose = (() => {});
			this.socket.close();
			this.socket = null;
		}
		this.all_chat = null;
	}
	set_all_chat(all_chat: AllChatState): void {
		this.all_chat = all_chat;
	}
	add_chat(chat: server_trigger.Chat): void {
		if ('Direct' in chat) {
			const direct_chat = chat.Direct;
			console.log(direct_chat);
			this.all_chat!.addDirectChat(direct_chat.chat_id, new DirectChatData(
				direct_chat.name,
				direct_chat.chat_id,
				{
					is_fake: false,
					id: direct_chat.chat_id,
					opposite: {
						kind: OppositeKind.Direct,
						opposite_id: direct_chat.opposite_id,
						opposite_name: direct_chat.name,
					}
				},
				to_history(direct_chat.last_msg),
				new Date(direct_chat.read_time)
			));
		} else if ('AnonymousArticle' in chat) {
			const article_chat = chat.AnonymousArticle;
			this.all_chat!.addDirectChat(article_chat.chat_id, new DirectChatData(
				article_chat.article_title,
				article_chat.chat_id,
				{
					is_fake: false,
					id: article_chat.chat_id,
					opposite: {
						kind: OppositeKind.AnonymousArticleMeta,
						article_id: article_chat.article_id,
						article_title: article_chat.article_title,
					}
				},
				to_history(article_chat.last_msg),
				new Date(article_chat.read_time),
			));
		}
	}
	reset(): void {
		const protocol = location.protocol == 'https:' ? 'wss' : 'ws';
		const url = `${protocol}://${window.location.hostname}:${window.location.port}/chat`;
		this.socket = new WebSocket(url);
		this.socket.onopen = () => {
			if (this.attempt_counter > 0) {
				this.attempt_counter = 0;
				toast('聊天室重連成功');
			}
		};
		this.socket.onclose = () => {
			if (this.attempt_counter >= MAX_ATTEMPT_TIMES) {
				toastErr('抱歉，無法恢復聊天室連線，請等待一段時間後手動重新整理');
				return;
			}

			const duration = Math.pow(5, this.attempt_counter + 1);

			this.attempt_counter++;

			if (this.attempt_counter == 1) {
				toastErr(`聊天室已斷線，嘗試重連 ${this.attempt_counter}/${MAX_ATTEMPT_TIMES}`);
			} else {
				toastErr(`重連失敗，將在 ${duration} 秒內再次嘗試重連 ${this.attempt_counter}/${MAX_ATTEMPT_TIMES}`);
			}

			setTimeout(() => {
				this.reset();
			}, duration * Math.random() * 1000);
		};
		this.socket.onmessage = (event) => {
			const api: server_trigger.API = JSON.parse(event.data);
			console.log(`from server: ${event.data}`);
			if ('InitInfo' in api) {

				console.log('init info');

				const init_info: server_trigger.InitInfo = api.InitInfo;
				for (const chat of init_info.chats) {
					this.add_chat(chat);
				}
			} else if ('MessageSending' in api) {
				const message_sending: MessageSending = api.MessageSending;

				console.log('message sending');
				console.log(`${JSON.stringify(message_sending)}`);

				if (this.all_chat == undefined) {
					console.log('all_chat 尚未載入');
				} else if (this.all_chat.all_chat.direct[message_sending.chat_id]) {
					// TODO: 使用伺服器傳回的日期、訊息 id
					this.all_chat.addMessage(message_sending.chat_id, new Message(-1, server_trigger.Sender.Opposite, message_sending.content, new Date()));
					if (!document.hasFocus()) {
						play_message_notification();
					}
				} else {
					// XXX: 如果初始化的時候沒有載入這個頻道（初始化的時候很可能不會載入所有頻道，僅會載入最近活躍的頻道），就會找不到聊天室
					console.error(`找不到聊天室：${message_sending.chat_id} ，重新整理可能可以解決問題`);
				}
			} else if ('NewChat' in api) {
				console.log('new chat');
				console.log(`${JSON.stringify(api.NewChat)}`);
				this.add_chat(api.NewChat);
			} else {
				console.error('無法識別的 server_trigger.API');
				console.log(`${JSON.stringify(api)}`);
			}
		};
	}
	send_message(chat_id: number, content: string): void {
		this.send_api({MessageSending: {chat_id, content}});
	}
	send_api(api: client_trigger.API): void {
		if (this.socket) {
			this.socket.send(JSON.stringify(api));
		} else {
			console.error('嘗試發送消息，但 socket 尚未建立');
		}
	}
}
