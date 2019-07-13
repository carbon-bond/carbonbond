import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState, AllChatState, Chat } from './global_state';

function ChatUnit(chat: Chat): JSX.Element {
	const { add_room } = BottomPanelState.useContainer();
	return <div styleName="chatUnit" onClick={() => add_room(chat.name)}>
		<div styleName="unitName">{chat.name}</div>
		<div styleName="lastMessage">
			<span>{chat.dialogs.slice(-1)[0].who}</span>
			:
			<span>{chat.dialogs.slice(-1)[0].content}</span>
		</div>
	</div>;
}

function ChatBar(): JSX.Element {
	const { all_chat: chat } = AllChatState.useContainer();
	return <div styleName="chatbar">
		<input type="text" placeholder="🔍 尋找對話" />
		{
			chat.two_people.map((r) => <ChatUnit key={r.name} {...r} />)
		}
	</div>;
}

export {
	ChatBar
};