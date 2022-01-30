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
	exist: boolean;
	name: string;
	newestMessage(): IMessage | undefined
	isUnread(): boolean
};

class AllChat {
	[immerable] = true;
	group: { [key: string]: GroupChatData };
	direct: { [key: string]: DirectChatData };
	constructor(group: { [key: string]: GroupChatData }, direct: { [key: string]: DirectChatData }) {
		this.group = group;
		this.direct = direct;
	}
	toRealDirectChat(name: string, chat_id: number): AllChat {
		return produce(this, (draft) => {
			draft.direct[name].exist = true;
			draft.direct[name].id = chat_id;
		});
	}
	addChat(name: string, chat: DirectChatData): AllChat {
		return produce(this, (draft) => {
			draft.direct[name] = chat;
		});
	}
	addMessage(name: string, message: Message): AllChat {
		return produce(this, draft => {
			draft.direct[name] = draft.direct[name].addMessage(message);
		});
	}
	addOldMessages(name: string, old_messages: Message[]): AllChat {
		return produce(this, draft => {
			draft.direct[name] = draft.direct[name].addOldMessages(old_messages);
		});
	}
	addChannelMessage(name: string, channel: string, message: Message): AllChat {
		return produce(this, draft => {
			draft.group[name].channels[channel] = draft.group[name].channels[channel]?.addMessage(message);
		});
	}
	updateReadTime(name: string, time: Date): AllChat {
		return produce(this, draft => {
			let chat = draft.direct[name];
			if (chat) {
				chat.read_time = time;
			}
		});
	}
	updateChannelReadTime(name: string, channel: string, time: Date): AllChat {
		return produce(this, draft => {
			let chat = draft.group[name].channels[channel];
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
	addDirectChat: Function,
	addMessage: Function
	addChannelMessage: Function
	updateLastRead: Function
	updateLastReadChannel: Function
};

function useAllChatState(): AllChatState {

	let [all_chat, setAllChat] = useState<AllChat>(new AllChat(
		{},
		{},
	));

	function reset(): void {
		setAllChat(new AllChat({}, {}));
	}

	function addDirectChat(name: string, chat: DirectChatData): void {
		// TODO: 先去資料庫裏撈聊天室
		// 可能有太舊的對話沒有被載入到客戶端
		if (all_chat.direct[name] == undefined) {
			setAllChat(all_chat.addChat(name, chat));
		}
	}

	function addMessage(name: string, message: Message): void {
		setAllChat(all_chat.addMessage(name, message));
	}

	function addChannelMessage(name: string, channel_name: string, message: Message): void {
		setAllChat(all_chat.addChannelMessage(name, channel_name, message));
	}

	// 只作用於雙人
	function updateLastRead(name: string, time: Date): void {
		setAllChat(all_chat.updateReadTime(name, time));
	}

	function updateLastReadChannel(name: string, channel_name: string, time: Date): void {
		setAllChat(all_chat.updateChannelReadTime(name, channel_name, time));
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