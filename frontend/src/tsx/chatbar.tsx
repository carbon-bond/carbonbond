import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState, AllChatState, ChatData } from './global_state';
import { rough_date } from '../ts/date';

// TODO: 文字太長以致超出 ChatUnit 大小時，要有自動附加刪節號底提示讀者
function ChatUnit(props: { chat: ChatData }): JSX.Element {
	const { add_room } = BottomPanelState.useContainer();
	const dialog = props.chat.newest_dialog();

	function Title(): JSX.Element {
		const channel = props.chat.newest_channel_name();
		if (channel == null) {
			return <span styleName="name">{props.chat.name}</span>;
		} else {
			return <>
				<span styleName="name">{props.chat.name}</span>
				<span styleName="channel">#{channel}</span>
			</>;
		}
	}

	return <div styleName="chatUnit" onClick={() => add_room(props.chat.name)}>
		<div styleName="upSet">
			<div styleName="title">
				<Title />
			</div>
			<div styleName="date">{rough_date(dialog.date)}</div>
		</div>
		<div styleName="downSet">
			<div styleName="lastMessage">
				<span>{dialog.who}</span>
				：
				<span>{dialog.content}</span>
			</div>
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