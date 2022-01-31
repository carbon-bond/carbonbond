import { createContainer } from 'unstated-next';
import * as React from 'react';
const { useState } = React;
import produce, { immerable } from 'immer';
import {server_trigger} from '../../ts/api/api_trait';

export class Message {
	[immerable] = true;
	id: number;
	sender: server_trigger.Sender;
	content: string;
	time: Date;
	constructor(id: number, sender: server_trigger.Sender, content: string, time: Date) {
		this.id = id;
		this.sender = sender;
		this.content = content;
		this.time = time;
	}
}

export class DirectChatData implements ChatData {
	[immerable] = true;
	exhaust_history: boolean;
	history: Message[];
	name: string;
	id: number;
	opposite_id: number;
	read_time: Date;
	exist: boolean;
	constructor(name: string, id: number, opposite_id: number, history: Message[], read_time: Date, exist: boolean) {
		this.exhaust_history = false;
		this.name = name;
		this.id = id;
		this.opposite_id = opposite_id;
		this.history = history;
		this.read_time = read_time;
		this.exist = exist;
	}
	isUnread(): boolean {
		const last_msg = this.history[this.history.length - 1];
		if (last_msg == undefined) {
			return false;
		} else {
			return this.read_time < last_msg.time;
		}
	}
	newestMessage(): Message | undefined {
		return this.history[this.history.length - 1];
	}
	addMessage(message: Message): DirectChatData {
		return produce(this, (draft) => {
			draft.history.push(message);
		});
	}
	addOldMessages(old_messages: Message[]): DirectChatData {
		return produce(this, (draft) => {
			if (old_messages.length > 0) {
				draft.history = [...old_messages, ...draft.history];
			} else {
				draft.exhaust_history = true;
			}
		});
	}
}

// NOTE: 目前的 DirectChatData 與 ChannelData 完全相同
// 但之後 ChannelData 會有自己的特殊屬性，如公開／私有
class ChannelData extends DirectChatData {
	[immerable] = true;
};

export class GroupChatData {
	[immerable] = true;
	exist: boolean;
	name: string;
	id: number;
	is_upgraded: boolean;
	channels: { [key: string]: ChannelData };
	read_time: Date;
	constructor(name: string, id: number, is_upgraded: boolean, channels: { [key: string]: ChannelData }, read_time: Date) {
		this.exist = true;
		this.name = name;
		this.id = id;
		this.is_upgraded = is_upgraded;
		this.channels = channels;
		this.read_time = read_time;
	}
	isUnread(): boolean {
		return this.unreadChannels().length > 0;
	}
	unreadChannels(): ChannelData[] {
		return Object.values(this.channels).filter(channel => channel.isUnread());
	}
	newestMessage(): Message | undefined {
		if (this.is_upgraded) {
			return undefined;
		} else {
			return Object.values(this.channels)
				.map(channel => channel.history[channel.history.length - 1])
				.filter(x => x != undefined)
				.sort((c1, c2) => Number(c1.time) - Number(c2.time))[0];
		}
	}
}

export interface IMessage {
	sender: server_trigger.Sender,
	content: string,
	time: Date
};

export interface ChatData {
	id: number;
	exist: boolean;
	name: string;
	newestMessage(): IMessage | undefined
	isUnread(): boolean
};

class AllChat {
	[immerable] = true;
	group: { [key: number]: GroupChatData };
	direct: { [key: number]: DirectChatData };
	constructor(group: { [key: number]: GroupChatData }, direct: { [key: number]: DirectChatData }) {
		this.group = group;
		this.direct = direct;
	}
	toRealDirectChat(fake_id: number, chat_id: number): AllChat {
		return produce(this, (draft) => {
			draft.direct[chat_id] = draft.direct[fake_id];
			draft.direct[chat_id].exist = true;
			draft.direct[chat_id].id = chat_id;
			delete draft.direct[fake_id];
		});
	}
	addChat(id: number, chat: DirectChatData): AllChat {
		return produce(this, (draft) => {
			draft.direct[id] = chat;
		});
	}
	addMessage(id: number, message: Message): AllChat {
		return produce(this, draft => {
			draft.direct[id] = draft.direct[id].addMessage(message);
		});
	}
	addOldMessages(id: number, old_messages: Message[]): AllChat {
		return produce(this, draft => {
			draft.direct[id] = draft.direct[id].addOldMessages(old_messages);
		});
	}
	addChannelMessage(id: number, channel: string, message: Message): AllChat {
		return produce(this, draft => {
			draft.group[id].channels[channel] = draft.group[id].channels[channel]?.addMessage(message);
		});
	}
	updateReadTime(id: number, time: Date): AllChat {
		return produce(this, draft => {
			let chat = draft.direct[id];
			if (chat) {
				chat.read_time = time;
			}
		});
	}
	updateChannelReadTime(id: number, channel: string, time: Date): AllChat {
		return produce(this, draft => {
			let chat = draft.group[id].channels[channel];
			if (chat) {
				chat.read_time = time;
			}
		});
	}
}

export type AllChatState = {
	all_chat: AllChat,
	setAllChat: React.Dispatch<React.SetStateAction<AllChat>>,
	reset: () => void,
	addDirectChat: (id: number, chat: DirectChatData) => void,
	addMessage: (id: number, message: Message) => void
	addChannelMessage: (id: number, channel_name: string, message: Message) => void
	updateLastRead: (id: number, time: Date) => void
	updateLastReadChannel: (id: number, channel_name: string, time: Date) => void
};

function useAllChatState(): AllChatState {

	let [all_chat, setAllChat] = useState<AllChat>(new AllChat(
		{},
		{},
	));

	function reset(): void {
		setAllChat(new AllChat({}, {}));
	}

	function addDirectChat(id: number, chat: DirectChatData): void {
		// TODO: 先去資料庫裏撈聊天室
		// 可能有太舊的對話沒有被載入到客戶端
		setAllChat(all_chat.addChat(id, chat));
	}

	function addMessage(id: number, message: Message): void {
		setAllChat(all_chat.addMessage(id, message));
	}

	function addChannelMessage(id: number, channel_name: string, message: Message): void {
		setAllChat(all_chat.addChannelMessage(id, channel_name, message));
	}

	// 只作用於雙人
	function updateLastRead(id: number, time: Date): void {
		setAllChat(all_chat.updateReadTime(id, time));
	}

	function updateLastReadChannel(id: number, channel_name: string, time: Date): void {
		setAllChat(all_chat.updateChannelReadTime(id, channel_name, time));
	}

	return {
		all_chat,
		reset,
		setAllChat,
		addDirectChat,
		addMessage,
		addChannelMessage,
		updateLastRead,
		updateLastReadChannel
	};
}

export const AllChatState = createContainer(useAllChatState);