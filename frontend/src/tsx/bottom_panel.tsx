import * as React from 'react';
import '../css/bottom_panel.css';
import { relative_date } from '../ts/date';
import { differenceInMinutes } from 'date-fns';
import { BottomPanelState, AllChatState, Dialog } from './global_state';
import { useScrollBottom, useInputValue } from './utils';
import { EditorPanel } from './editor_panel';

type AggDialog = {
	who: string,
	date: Date,
	contents: string[]
};

function aggregateDiaglogs(dialogs: Dialog[]): AggDialog[] {
	if (dialogs.length == 0) {
		return [];
	}
	let tmp = {
		who: dialogs[0].who,
		date: dialogs[0].date,
		contents: [dialogs[0].content]
	};
	if (dialogs.length == 1) {
		return [tmp];
	}
	const ret: AggDialog[] = [];
	let cur_date = tmp.date;
	for (let i = 1; i < dialogs.length; i++) {
		// 如果作者相同、上下兩則訊息相距不到一分鐘，則在 UI 上合併
		const dialog = dialogs[i];
		if (tmp.who == dialog.who && differenceInMinutes(dialog.date, cur_date) < 1) {
			tmp.contents.push(dialog.content);
		} else {
			ret.push(tmp);
			tmp = {
				who: dialog.who,
				date: dialog.date,
				contents: [dialog.content]
			};
		}
		cur_date = dialog.date;
	}
	ret.push(tmp);
	return ret;
}

const DialogBlocks = (props: {dialogs: Dialog[]}): JSX.Element => {
	const agg_dialogs = aggregateDiaglogs(props.dialogs);
	return <>
	{
		// XXX: key 要改成能表示時間順序的 id
		agg_dialogs.map(dialog => <div key={Number(dialog.date)} styleName="DialogBlock">
			<div styleName="meta">
				<span styleName="who">{dialog.who}</span>
				<span styleName="date">{relative_date(dialog.date)}</span>
			</div>
			{
				dialog.contents.map((content, index) => {
					return <div key={index} styleName="content">{content}</div>;
				})
			}
		</div>)
	}
	</>
	;
};

interface RoomData {
	name: string
}

// 聊天室
function ChatRoomPanel(props: {room: RoomData}): JSX.Element {
	const [extended, setExtended] = React.useState(true);
	const { input_props, setValue } = useInputValue('');
	const scroll_bottom_ref = useScrollBottom();
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
				add_dialog(props.room.name, {
					who: '金剛', // TODO: 換成 me
					content: input_props.value,
					date: new Date(),
				});
				setValue('');
			}
		}

		const chat = all_chat.two_people.find(c => c.name == props.room.name);
		if (chat == undefined) {
			console.warn(`找不到聊天室 ${props.room.name}`);
		}

		return <div styleName="chatPanel singlePanel">
			<div styleName="roomTitle title">
				<div styleName="leftSet">{props.room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(false)}></div>
				<div styleName="rightSet">
					<div styleName="button">⚙</div>
					<div styleName="button" onClick={() => delete_room(props.room.name)}>✗</div>
				</div>
			</div>
			<div ref={scroll_bottom_ref} styleName="chatContent">
				<DialogBlocks dialogs={chat!.dialogs}/>
			</div>
			<div styleName="inputBar">
				<div styleName="nonText">😎</div>
				<input ref={inputElement} {...input_props} onKeyDown={onKeyDown} type="text" placeholder="輸入訊息..." />
			</div>
		</div>;
	} else {
		return <div styleName="chatPanel singlePanel">
			<div styleName="roomTitle title">
				<div styleName="leftSet">{props.room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(true)}></div>
				<div styleName="rightSet">
					<div styleName="button" onClick={() => delete_room(props.room.name)}>✗</div>
				</div>
			</div>
		</div>;
	}
}

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