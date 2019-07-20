import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState, AllChatState, ChatData, SimpleChatData, ChannelChatData } from './global_state';
import { rough_date } from '../ts/date';

// TODO: 文字太長以致超出 ChatUnit 大小時，要自動附加刪節號提示讀者
function ChatUnit(props: { chat: ChatData }): JSX.Element {
	const { add_room, add_room_with_channel } = BottomPanelState.useContainer();
	const dialog = props.chat.newest_dialog();
	const is_unread = props.chat.is_unread();

	function UnreadInfo(): JSX.Element {
		if (props.chat instanceof SimpleChatData) {
			return <div styleName="lastMessage">
				<span>{dialog.who}</span>
				：
				<span>{dialog.content}</span>
			</div>;
		} else if (props.chat instanceof ChannelChatData) {
			let channels = props.chat.unread_channels();
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
		const date = rough_date(dialog.date);
		if (is_unread) {
			return <div styleName="date"><span styleName="circle">⬤</span> {date}</div>;
		} else {
			return <div styleName="date">{date}</div>;
		}
	}

	function on_click(): void {
		if (props.chat instanceof SimpleChatData) {
			add_room(props.chat.name);
		} else if (props.chat instanceof ChannelChatData) {
			if (props.chat.unread_channels().length == 0) {
				add_room_with_channel(props.chat.name, props.chat.channels[0].name);
			} else {
				add_room_with_channel(props.chat.name, props.chat.unread_channels()[0]);
			}
		}
	}

	return <div styleName={`chatUnit${is_unread ? ' bold' : ''}`} onClick={on_click}>
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
	return Number(y.newest_dialog().date) - Number(x.newest_dialog().date);
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