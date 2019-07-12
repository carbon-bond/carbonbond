import * as React from 'react';
import '../css/bottom_panel.css';
import { BottomPanelState } from './global_state';

// 文章編輯器
// function EditorPanel(): JSX.Element {
// 	return <div></div>;
// }

interface RoomData {
	name: string
}

// 聊天室
function ChatRoomPanel(room: RoomData): JSX.Element {
	const [extended, setExtended] = React.useState(true);
	const { delete_room } = BottomPanelState.useContainer();
	if (extended) {
		return <div styleName="chatPanel">
			<div styleName="roomTitle">
				<div styleName="leftSet">{room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(false)}></div>
				<div styleName="rightSet">
					<div styleName="button">⚙</div>
					<div styleName="button" onClick={() => delete_room(room.name)}>✗</div>
				</div>
			</div>
			<div styleName="chatContent"></div>
			<div styleName="inputBar">
				<div styleName="nonText">➕</div>
				<div styleName="nonText">😎</div>
				<input type="text" placeholder="輸入訊息..." />
			</div>
		</div>;
	} else {
		return <div styleName="chatPanel">
			<div styleName="roomTitle">
				<div styleName="leftSet">{room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(true)}></div>
				<div styleName="rightSet">
					<div styleName="button" onClick={() => delete_room(room.name)}>✗</div>
				</div>
			</div>
		</div>;
	}
}

function BottomPanel(): JSX.Element {
	const { chatrooms } = BottomPanelState.useContainer();
	return <div styleName="bottomPanel">
		{chatrooms.map(room => <ChatRoomPanel key={room.name} {...room} />)}
	</div>;
}

export {
	BottomPanel
};