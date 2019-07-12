import * as React from 'react';
import '../css/chatbar.css';
import { BottomPanelState } from './global_state';

interface ChatUnitData {
	name: string,
	last_message: { who: string, content: string }
}

function ChatUnit(data: ChatUnitData): JSX.Element {
	const { add_room } = BottomPanelState.useContainer();
	return <div styleName="chatUnit" onClick={() => add_room(data.name)}>
		<div styleName="unitName">{data.name}</div>
		<div styleName="lastMessage">
			<span>{data.last_message.who}</span>
			:
			<span>{data.last_message.content}</span>
		</div>
	</div>;
}

function ChatBar(): JSX.Element {
	const friends = [
		{
			name: '玻璃碳',
			last_message: {
				who: '玻璃碳',
				content: '送出了一張貼圖',
			}
		},
		{
			name: '石墨',
			last_message: {
				who: '金剛',
				content: '送出了一張貼圖'
			}
		},
		{
			name: '芙',
			last_message: {
				who: '芙',
				content: '一直流鼻涕'
			}
		},
		{
			name: '六方',
			last_message: {
				who: '金剛',
				content: '幫幫窩'
			}
		}
	];
	return <div styleName="chatbar">
		<input type="text" placeholder="🔍 尋找對話" />
		{
			friends.map((friend) => <ChatUnit key={friend.name} {...friend} />)
		}
	</div>;
}

export {
	ChatBar
};