import { createContainer } from 'unstated-next';
import * as React from 'react';
const { useState } = React;
import produce, { immerable } from 'immer';

export class Message {
	[immerable] = true;
	sender_name: string;
	content: string;
	time: Date;
	constructor(sender_name: string, content: string, time: Date) {
		this.sender_name = sender_name;
		this.content = content;
		this.time = time;
	}
}

export class DirectChatData implements ChatData {
	[immerable] = true;
	history: Message[];
	name: string;
	id: number;
	read_time: Date;
	constructor(name: string, id: number, history: Message[], read_time: Date) {
		this.name = name;
		this.id = id;
		this.history = history;
		this.read_time = read_time;
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
			draft.read_time = message.time;
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
	name: string;
	id: number;
	is_upgraded: boolean;
	channels: { [key: string]: ChannelData };
	read_time: Date;
	constructor(name: string, id: number, is_upgraded: boolean, channels: { [key: string]: ChannelData }, read_time: Date) {
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
	sender_name: string,
	content: string,
	time: Date
};

export interface ChatData {
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
	addChat(name: string, chat: DirectChatData): AllChat {
		return produce(this, (draft) => {
			draft.direct[name] = chat;
		});
	}
	addMessage(name: string, message: Message): AllChat {
		return produce(this, draft => {
			draft.direct[name].addMessage(message);
		});
	}
	addChannelMessage(name: string, channel: string, message: Message): AllChat {
		return produce(this, draft => {
			draft.group[name].channels[channel]?.addMessage(message);
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
	all_chat: AllChat
	addDirectChat: Function,
	addMessage: Function
	addChannelMessage: Function
	updateLastRead: Function
	updateLastReadChannel: Function
};

function useAllChatState(): AllChatState {

	let [all_chat, setAllChat] = useState<AllChat>(new AllChat(
		// TODO: 刪掉假數據
		{
			'無限城': new GroupChatData(
				'無限城',
				200001,
				false,
				{
					'VOLTS 四天王': new ChannelData(
						'VOLTS 四天王',
						100001,
						[
							new Message('冬木士度', '那時我認為他是個怪人', new Date(2019, 6, 14)),
							new Message('風鳥院花月', '我也是', new Date(2019, 6, 15))
						],
						new Date(2019, 7, 13)
					),
					'主頻道': new ChannelData(
						'主頻道',
						100002,
						[
							new Message('美堂蠻', '午餐要吃什麼？', new Date(2019, 1, 14)),
							new Message('馬克貝斯', '沒意見', new Date(2019, 1, 15)),
							new Message('天子峰', '都可', new Date(2019, 1, 16))
						],
						new Date(2018, 7, 13)
					),
					'閃靈二人組': new ChannelData(
						'閃靈二人組',
						100003,
						[
							new Message('天野銀次', '肚子好餓', new Date(2018, 11, 4)),
							new Message('美堂蠻', '呿！', new Date(2019, 3, 27))
						],
						new Date(2018, 6, 13)
					)
				},
				new Date()
			)
		},
		{},
	));

	function addDirectChat(name: string, chat: DirectChatData): void {
		setAllChat(all_chat.addChat(name, chat));
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
		addDirectChat,
		addMessage,
		addChannelMessage,
		updateLastRead,
		updateLastReadChannel
	};
}

export const AllChatState = createContainer(useAllChatState);