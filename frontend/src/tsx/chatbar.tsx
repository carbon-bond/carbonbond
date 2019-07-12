import * as React from 'react';
import '../css/chatbar.css';

interface ChatUnitData {
	name: string,
	last_message: { who: string, content: string }
}

function ChatUnit(data: ChatUnitData): JSX.Element {
	return <div styleName="chatUnit">
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
			name: '建中',
			last_message: {
				who: '建中',
				content: '送出了一張貼圖',
			}
		},
		{
			name: '軟蛋',
			last_message: {
				who: 'MROS',
				content: '送出了一張貼圖'
			}
		}
	];
	return <div styleName="chatbar">
		<input type="text" placeholder="🔍 尋找對話" />
		{
			friends.map((friend) => ChatUnit(friend))
		}
	</div>;
}

export {
	ChatBar
};