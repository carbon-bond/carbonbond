import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState, AllChatState, ChatData, SimpleChatData, ChannelChatData } from './global_state';
import { roughDate } from '../ts/date';

// TODO: 文字太長以致超出 ChatUnit 大小時，要自動附加刪節號提示讀者
function ChatUnit(props: { chat: ChatData }): JSX.Element {
	const { addRoom, addRoomWithChannel } = BottomPanelState.useContainer();
	const dialog = props.chat.newestDialog();
	const is_unread = props.chat.isUnread();

	function UnreadInfo(): JSX.Element {
		if (props.chat instanceof SimpleChatData) {
			return <div styleName="lastMessage">
				<span>{dialog.who}</span>
				：
				<span>{dialog.content}</span>
			</div>;
		} else if (props.chat instanceof ChannelChatData) {
			let channels = props.chat.unreadChannels();
			return <div styleName="unreadChannels">
				{
					channels.length == 0 ?
						<span styleName="allRead">所有頻道訊息皆已讀取</span> :
						channels.map(c => {
							return <span key={c} styleName="channel">#{c}</span>;
						})
				}
			</div>;
		} else {
			console.error(`未知的 ChatData 介面：${typeof props.chat}`);
			return <></>;
		}
	}
	function LastDate(): JSX.Element {
		const date = roughDate(dialog.date);
		if (is_unread) {
			return <div styleName="date"><span styleName="circle">⬤</span> {date}</div>;
		} else {
			return <div styleName="date">{date}</div>;
		}
	}

	function onClick(): void {
		if (props.chat instanceof SimpleChatData) {
			addRoom(props.chat.name);
		} else if (props.chat instanceof ChannelChatData) {
			if (props.chat.unreadChannels().length == 0) {
				addRoomWithChannel(props.chat.name, props.chat.channels[0].name);
			} else {
				addRoomWithChannel(props.chat.name, props.chat.unreadChannels()[0]);
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
	return Number(y.newestDialog().date) - Number(x.newestDialog().date);
};

function ChatBar(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let chat_array: ChatData[] = all_chat.two_people;
	chat_array = chat_array.concat(all_chat.party);
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