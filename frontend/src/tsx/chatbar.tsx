import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState, AllChatState, ChatData, DirectChatData, GroupChatData } from './global_state';
import { roughDate } from '../ts/date';

function ChatUnit(props: { chat: ChatData }): JSX.Element {
	const { addRoom, addRoomWithChannel } = BottomPanelState.useContainer();
	const message = props.chat.newestMessage()!;
	const is_unread = props.chat.isUnread();

	function UnreadInfo(): JSX.Element {
		if (props.chat instanceof DirectChatData) {
			return <div styleName="lastMessage">
				<span>{message.sender_name}</span>
				：
				<span>{message.content}</span>
			</div>;
		} else if (props.chat instanceof GroupChatData) {
			let channels = props.chat.unreadChannels();
			return <div styleName="unreadChannels">
				{
					channels.size == 0 ?
						<span styleName="allRead">所有頻道訊息皆已讀取</span> :
						channels.map(c => {
							return <span key={c.name} styleName="channel">#{c.name}</span>;
						})
				}
			</div>;
		} else {
			console.error(`未知的 ChatData 介面：${typeof props.chat}`);
			return <></>;
		}
	}

	function LastDate(): JSX.Element {
		const date = roughDate(message.time);
		if (is_unread) {
			return <div styleName="date"><span styleName="circle">⬤</span> {date}</div>;
		} else {
			return <div styleName="date">{date}</div>;
		}
	}

	function onClick(): void {
		console.log('click');
		if (props.chat instanceof DirectChatData) {
			addRoom(props.chat.name);
		} else if (props.chat instanceof GroupChatData) {
			if (props.chat.unreadChannels().isEmpty()) {
				addRoomWithChannel(props.chat.name, (props.chat.channels.first() as GroupChatData).name);
			} else {
				addRoomWithChannel(props.chat.name, (props.chat.unreadChannels().first() as GroupChatData).name);
			}
		}
	}

	return <div styleName={`chatUnit${is_unread ? ' bold' : ''}`} onClick={onClick}>
		<div styleName="upSet">
			<div styleName="title">
				<span styleName="name">{props.chat.name}</span>
			</div>
			<LastDate />
		</div>
		<div styleName="downSet">
			<UnreadInfo />
		</div>
	</div>;
}

// NOTE: 在每次更新數據時都維護排序，就無需在組件渲染時才排序
const date_cmp = (x: ChatData, y: ChatData): number => {
	const x_msg = x.newestMessage();
	const y_msg = y.newestMessage();
	if (x_msg == undefined || y_msg == undefined) {
		throw new Error('無歷史記錄');
	}
	return Number(y_msg!.time) - Number(x_msg!.time);
};

function ChatBar(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let chat_array: ChatData[] = Array.from(all_chat.direct.values());
	chat_array = chat_array.concat(Array.from(all_chat.group.values()));
	return <div styleName="chatbar">
		<input type="text" placeholder="🔍 尋找對話" />
		{
			chat_array.sort(date_cmp).map((r) => <ChatUnit key={r.name} chat={r} />)
		}
	</div>;
}

export {
	ChatBar
};