import * as React from 'react';
import '../css/bottom_panel.css';

// 文章編輯器
// function EditorPanel(): JSX.Element {
// 	return <div></div>;
// }

interface RoomData {
	name: string
}

// 聊天室
function ChatRoomPanel(room: RoomData): JSX.Element {
	return <div styleName="chatPanel">
		<div styleName="roomName">{room.name}</div>
		<div styleName="chatContent"></div>
		<div styleName="inputBar">
			<input type="text" placeholder="輸入訊息..."/>
		</div>
	</div>;
}

function BottomPanel(): JSX.Element {
	const rooms = [
		{ name: '建中' },
		{ name: '軟蛋' },
		{ name: 'Veil' },
	];
	return <div styleName="bottomPanel">
		{rooms.map(room => <ChatRoomPanel {...room} />)}
	</div>;
}

export {
	BottomPanel
};