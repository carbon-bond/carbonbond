import * as React from 'react';
import '../css/bottom_panel.css';
import { rough_date } from '../ts/date';
import { BottomPanelState, AllChatState, Dialog } from './global_state';
import { useInputValue } from './utils';

// 文章編輯器
// function EditorPanel(): JSX.Element {
// 	return <div></div>;
// }

function DialogBlocks(dialogs: Dialog[]): JSX.Element {
	return <>
	{
		// XXX: key 要改成能表示時間順序的 id
		dialogs.map(dialog => <div key={Number(dialog.date)} styleName="DialogBlock">
			<div styleName="meta">
				<span styleName="who">{dialog.who}</span>
				<span styleName="date">{rough_date(dialog.date)}</span>
			</div>
			<div styleName="content">{dialog.content}</div>
		</div>)
	}
	</>
	;
}

interface RoomData {
	name: string
}

// 聊天室
function ChatRoomPanel(room: RoomData): JSX.Element {
	const [extended, setExtended] = React.useState(true);
	const {input_props, setValue} = useInputValue('');
	const inputElement = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		if (extended && inputElement && inputElement.current) {  // 判斷式只是爲了 TS 的型別檢查
			inputElement.current.focus();
		}
	}, [extended]);
	const { delete_room } = BottomPanelState.useContainer();
	const { all_chat, add_dialog } = AllChatState.useContainer();

	if (extended) {

		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				add_dialog(room.name, {
					who: '金剛', // TODO: 換成 me
					content: input_props.value,
					date: new Date(),
				});
				setValue('');
			}
		}

		const chat = all_chat.two_people.find(c => c.name == room.name);
		if (chat == undefined) {
			console.warn(`找不到聊天室 ${room.name}`);
		}

		return <div styleName="chatPanel">
			<div styleName="roomTitle">
				<div styleName="leftSet">{room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(false)}></div>
				<div styleName="rightSet">
					<div styleName="button">⚙</div>
					<div styleName="button" onClick={() => delete_room(room.name)}>✗</div>
				</div>
			</div>
			<div styleName="chatContent">
				{DialogBlocks(chat!.dialogs)}
			</div>
			<div styleName="inputBar">
				<div styleName="nonText">➕</div>
				<div styleName="nonText">😎</div>
				<input ref={inputElement} {...input_props} onKeyDown={onKeyDown} type="text" placeholder="輸入訊息..." />
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