import * as React from 'react';
import '../css/bottom_panel.css';
import { BottomPanelState } from './global_state';
import { EditorPanel } from './editor_panel';
import { ChatRoomPanel } from './chatroom_panel';


function BottomPanel(): JSX.Element {
	const { chatrooms } = BottomPanelState.useContainer();
	return <div styleName="bottomPanel">
		{chatrooms.map(room => <ChatRoomPanel key={room.name} room={room} />)}
		<EditorPanel/>
	</div>;
}

export {
	BottomPanel
};