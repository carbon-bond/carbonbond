import * as React from 'react';
import style from '../css/bottom_panel/bottom_panel.module.css';
import { BottomPanelState } from './global_state/bottom_panel';
import { EditorPanel } from './editor_panel';
import { ChatRoomPanel } from './chatroom_panel';


function BottomPanel(): JSX.Element {
	const { chatrooms } = BottomPanelState.useContainer();
	return <div className={style.bottomPanel}>
		{chatrooms.map(room => <div key={room.id}><ChatRoomPanel room={room} /></div>)}
		<EditorPanel/>
	</div>;
}

export {
	BottomPanel
};