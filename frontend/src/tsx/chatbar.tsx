import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState, AllChatState, Chat } from './global_state';
import { rough_date } from '../ts/date';

// TODO: 文字太長以致超出 ChatUnit 大小時，要有自動附加刪節號底提示讀者
function ChatUnit(chat: Chat): JSX.Element {
	const { add_room } = BottomPanelState.useContainer();
	return <div styleName="chatUnit" onClick={() => add_room(chat.name)}>
		<div styleName="upSet">
			<div styleName="unitName">{chat.name}</div>
			<div styleName="date">{rough_date(chat.dialogs.slice(-1)[0].date)}</div>
		</div>
		<div styleName="downSet">
			<div styleName="lastMessage">
				<span>{chat.dialogs.slice(-1)[0].who}</span>
				：
				<span>{chat.dialogs.slice(-1)[0].content}</span>
			</div>
		</div>
	</div>;
}

// NOTE: 在每次更新數據時都維護排序，就無需在組件渲染時才排序
const date_cmp = (x: Chat, y: Chat): number => {
	return Number(y.dialogs.slice(-1)[0].date) - Number(x.dialogs.slice(-1)[0].date);
};

function ChatBar(): JSX.Element {
	const { all_chat: chat } = AllChatState.useContainer();
	return <div styleName="chatbar">
		<input type="text" placeholder="🔍 尋找對話" />
		{
			chat.two_people.concat().sort(date_cmp).map((r) => <ChatUnit key={r.name} {...r} />)
		}
	</div>;
}

export {
	ChatBar
};