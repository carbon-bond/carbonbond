import { createContainer } from 'unstated-next';
import * as React from 'react';
const { useState } = React;
import { Record, List, Map } from 'immutable';

export class Message extends Record({ sender_name: '', content: '', time: new Date(0) }) {
	static fromProtobuf(message: IMessage): Message {
		return new Message({
			sender_name: message.sender_name!,
			content: message.content!,
			time: new Date(message.time!)
		});
	}
}

export class DirectChatData extends Record({
	history: List<Message>(),
	name: '',
	id: 0,
	read_time: new Date(0)
}) implements ChatData {
	isUnread(): boolean {
		const last_msg = this.history.last(undefined);
		if (last_msg == undefined) {
			return false;
		} else {
			return this.read_time < last_msg.time;
		}
	}
	newestMessage(): Message | undefined {
		const last_msg = this.history.last(undefined);
		return last_msg;
	}
	addMessage(message: Message): DirectChatData {
		let res = this.update('history', (history) => {
			return history.push(message);
		});
		res = res.set('read_time', message.time);
		return res;
	}
}

// NOTE: 目前的 DirectChatData 與 ChannelData 完全相同
// 但之後 ChannelData 會有自己的特殊屬性，如公開／私有
class ChannelData extends DirectChatData {};

export class GroupChatData extends Record({
	name: '',
	id: 0,
	is_upgraded: false,
	channels: Map<string, ChannelData>(),
	read_time: new Date(0)
}) {
	isUnread(): boolean {
		return !this.unreadChannels().isEmpty();
	}
	unreadChannels(): List<ChannelData> {
		return this.channels.valueSeq().toList().filter(channel => channel.isUnread());
	}
	// TODO: 改名爲 newestMessage
	newestMessage(): Message | undefined {
		if (this.is_upgraded) {
			return undefined;
		} else {
			return this.channels
				.map(channel => channel.history.last(undefined))
				.filter(x => x != undefined)
				.sort((c1, c2) => Number(c1!.time) - Number(c2!.time)).first();
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

class AllChat extends Record({
	group: Map<string, GroupChatData>(),
	direct: Map<string, DirectChatData>(),
}) {
	addChat(name: string, chat: DirectChatData): AllChat {
		return this.setIn(['direct', name], chat);
	}
	addMessage(name: string, message: Message): AllChat {
		return this.updateIn(['direct', name], direct => direct.addMessage(message));
	}
	addChannelMessage(name: string, channel: string, message: Message): AllChat {
		return this.updateIn(['group', name, 'channels', channel], c => c.addMessage(message));
	}
	updateReadTime(name: string, time: Date): AllChat {
		return this.updateIn(['direct', name], direct => direct.set('read_time', time));
	}
	updateChannelReadTime(name: string, channel: string, time: Date): AllChat {
		return this.updateIn(['group', name, 'channels', channel], direct => direct.set('read_time', time));
	}
}

function useAllChatState(): {
	all_chat: AllChat
	addMessage: Function
	addChannelMessage: Function
	updateLastRead: Function
	updateLastReadChannel: Function
	} {

	let [all_chat, setAllChat] = useState<AllChat>(new AllChat({
		// TODO: 刪掉假數據
		group: Map({
			'無限城': new GroupChatData({
				name: '無限城',
				channels: Map({
					'VOLTS 四天王': new ChannelData({
						name: 'VOLTS 四天王',
						history: List([
							new Message({ sender_name: '冬木士度', content: '那時我認爲他是個怪人', time: new Date(2019, 6, 14) }),
							new Message({ sender_name: '風鳥院花月', content: '我也是', time: new Date(2019, 6, 15) })
						]),
						read_time: new Date(2019, 7, 13)
					}),
					'主頻道': new ChannelData({
						name: '主頻道',
						history: List([
							new Message({ sender_name: '美堂蠻', content: '午餐要吃什麼？', time: new Date(2019, 1, 14) }),
							new Message({ sender_name: '馬克貝斯', content: '沒意見', time: new Date(2019, 1, 15) }),
							new Message({ sender_name: '天子峰', content: '都可', time: new Date(2019, 1, 16) })
						]),
						read_time: new Date(2018, 7, 13)
					}),
					'閃靈二人組': new ChannelData({
						name: '閃靈二人組',
						history: List([
							new Message({ sender_name: '天野銀次', content: '肚子好餓', time: new Date(2018, 11, 4) }),
							new Message({ sender_name: '美堂蠻', content: '呿！', time: new Date(2019, 3, 27) })
						]),
						read_time: new Date(2018, 6, 13)
					})
				})
			})
		}),
		direct: Map({ })
	}));


	React.useEffect(() => {
		const _onmessage = (event: MessageEvent): void => {
			// 改用 chitin
			console.log(event);
		};
	}, [all_chat]);

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
		addMessage,
		addChannelMessage,
		updateLastRead,
		updateLastReadChannel
	};
}

export const AllChatState = createContainer(useAllChatState);