import * as React from 'react';
import '../css/bottom_panel.css';
import { relativeDate } from '../ts/date';
import { differenceInMinutes } from 'date-fns';
import { useScrollBottom, useInputValue } from './utils';
import useOnClickOutside from 'use-onclickoutside';
import {
	BottomPanelState,
	AllChatState,
	Dialog,
	RoomData,
	SimpleRoomData,
	ChannelRoomData,
	isChannelRoomData
} from './global_state';
import 'emoji-mart/css/emoji-mart.css?global';
import * as EmojiMart from 'emoji-mart';


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

const DialogBlocks = React.memo((props: {dialogs: Dialog[]}): JSX.Element => {
	const agg_dialogs = aggregateDiaglogs(props.dialogs);
	return <>
	{
		// XXX: key 要改成能表示時間順序的 id
		agg_dialogs.map(dialog => <div key={Number(dialog.date)} styleName="DialogBlock">
			<div styleName="meta">
				<span styleName="who">{dialog.who}</span>
				<span styleName="date">{relativeDate(dialog.date)}</span>
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
});

type InputEvent = React.ChangeEvent<HTMLInputElement>;

type InputBarProp = {
	input_props: {
		onChange: (e: InputEvent) => void,
		value: string
	},
	setValue: React.Dispatch<React.SetStateAction<string>>,
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
};

type Emoji = {
	native: string
};

// TODO: 支援多頻道視窗、動態加載 emoji 選擇器
function InputBar(props: InputBarProp): JSX.Element {
	const inputElement = React.useRef<HTMLInputElement>(null);
	const [extendEmoji, setExtendEmoji] = React.useState(false);
	const ref = React.useRef(null);
	useOnClickOutside(ref, () => setExtendEmoji(false));

	function onSelect(emoji: EmojiMart.EmojiData): void {
		if (inputElement && inputElement.current) {  // 判斷式只是爲了 TS 的型別檢查
			inputElement.current.focus();
			const value = props.input_props.value;
			const start = inputElement.current.selectionStart;
			const end = inputElement.current.selectionEnd;
			if (start == null || end == null) {
				const new_value = value + (emoji as Emoji).native;
				props.setValue(new_value);
			} else {
				const left = value.slice(0, start);
				const right = value.slice(end);
				const new_value = left + (emoji as Emoji).native + right;
				props.setValue(new_value);
			}
		}
	}

	function onKeyDownWrap(e: React.KeyboardEvent<HTMLInputElement>): void {
		props.onKeyDown(e);
		setExtendEmoji(false);
	}

	return <div styleName="inputBar">
		<div styleName="nonText">
			<div onClick={() => setExtendEmoji(!extendEmoji)}>😎</div>
			{
				extendEmoji ?
					<div ref={ref}>
						<EmojiMart.Picker
							native={true}
							showPreview={false}
							showSkinTones={false}
							onSelect={onSelect}
							style={{ position: 'absolute', bottom: '40px', right: '100px' }} />
					</div> :
					<></>
			}
		</div>
		<input {...props.input_props}
			ref={inputElement}
			onKeyDown={onKeyDownWrap}
			type="text"
			placeholder="輸入訊息..."
			autoFocus
		/>
	</div>;
}

// 聊天室
function SimpleChatRoomPanel(props: {room: SimpleRoomData}): JSX.Element {
	const { deleteRoom } = BottomPanelState.useContainer();
	const { all_chat, addDialog: add_dialog, updateLastRead: update_last_read } = AllChatState.useContainer();
	const [extended, setExtended] = React.useState(true);
	const { input_props, setValue } = useInputValue('');
	const scroll_bottom_ref = useScrollBottom();
	const chat = all_chat.two_people.find(c => c.name == props.room.name);
	if (chat == undefined) { console.error(`找不到聊天室 ${props.room.name}`); }
	React.useEffect(() => {
		if (extended && chat!.isUnread()) {
			update_last_read(props.room.name, new Date());
		}
	}, [extended, chat, update_last_read, props.room.name]);

	if (extended) {

		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				const now = new Date();
				add_dialog(props.room.name, {
					who: '金剛', // TODO: 換成 me
					content: input_props.value,
					date: now,
				});
				setValue('');
			}
		}

		return <div styleName="chatPanel singlePanel">
			<div styleName="roomTitle title">
				<div styleName="leftSet">{props.room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(false)}></div>
				<div styleName="rightSet">
					<div styleName="button">⚙</div>
					<div styleName="button" onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
			<div ref={scroll_bottom_ref} styleName="dialogs">
				<DialogBlocks dialogs={chat!.dialogs}/>
			</div>
			<InputBar input_props={input_props} setValue={setValue} onKeyDown={onKeyDown}/>
		</div>;
	} else {
		return <div styleName="chatPanel singlePanel roomWidth">
			<div styleName="roomTitle title">
				<div styleName="leftSet">{props.room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(true)}></div>
				<div styleName="rightSet">
					<div styleName="button" onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
		</div>;
	}
}

function ChannelChatRoomPanel(props: {room: ChannelRoomData}): JSX.Element {
	console.log(`組件 ${props.room.name}#${JSON.stringify(props.room.channel)}`);
	const { deleteRoom, changeChannel } = BottomPanelState.useContainer();
	const { all_chat, addChannelDialog, updateLastReadChannel: updateLastReadChannel } = AllChatState.useContainer();
	const [extended, setExtended] = React.useState(true);
	const { input_props, setValue } = useInputValue('');
	const scroll_bottom_ref = useScrollBottom();
	const inputElement = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		if (extended && inputElement && inputElement.current) {  // 判斷式只是爲了 TS 的型別檢查
			inputElement.current.focus();
		}
	}, [extended]);

	const chat = all_chat.party.find(c => c.name == props.room.name);
	if (chat == undefined) { console.error(`找不到聊天室 ${props.room.name}`); }
	const channel = chat!.channels.find(c => c.name == props.room.channel);
	if (channel == undefined) { console.error(`找不到頻道 ${props.room.channel}`); }

	React.useEffect(() => {
		if (extended && channel!.isUnread()) {
			updateLastReadChannel(props.room.name, props.room.channel, new Date());
		}
	}, [extended, channel, updateLastReadChannel, props.room.name, props.room.channel]);

	if (extended) {

		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				const now = new Date();
				addChannelDialog(props.room.name, props.room.channel, {
					who: '金剛', // TODO: 換成 me
					content: input_props.value,
					date: now,
				});
				setValue('');
			}
		}

		function ChannelList(): JSX.Element {
			return <div styleName="channelList">
				{
					chat!.channels.map(c => {
						const is_current = c.name == channel!.name;
						const channel_style = `channel${is_current ? ' selected' : ''}`;
						return <div styleName={channel_style} onClick={() => { changeChannel(chat!.name, c.name); }}>
							<span styleName="channelSymbol"># </span>
							{c.name}
						</div>;
					})
				}
			</div>;
		}

		return <div styleName="chatPanel singlePanel">
			<div styleName="roomTitle title">
				<div styleName="leftSet">{props.room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(false)}>#{props.room.channel}</div>
				<div styleName="rightSet">
					<div styleName="button">⚙</div>
					<div styleName="button" onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
			<div styleName="panelContent">
				<div styleName="channels">
					<div styleName="channelControl">
						<div styleName="leftSet">頻道列表</div>
						<div styleName="rightSet">➕</div>
					</div>
					<ChannelList />
				</div>
				<div styleName="chatContent">
					<div ref={scroll_bottom_ref} styleName="dialogs">
						<DialogBlocks dialogs={channel!.dialogs} />
					</div>
					<div styleName="inputBar">
						<div styleName="nonText">😎</div>
						<input ref={inputElement} {...input_props} onKeyDown={onKeyDown} type="text" placeholder="輸入訊息..." />
					</div>
				</div>
			</div>
		</div>;
	} else {
		return <div styleName="chatPanel singlePanel roomWidth">
			<div styleName="roomTitle title">
				<div styleName="leftSet">{props.room.name}</div>
				<div styleName="middleSet" onClick={() => setExtended(true)}>#{props.room.channel}</div>
				<div styleName="rightSet">
					<div styleName="button" onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
		</div>;
	}
}

function ChatRoomPanel(props: {room: RoomData}): JSX.Element {
	if (isChannelRoomData(props.room)) {
		return <ChannelChatRoomPanel room={props.room} />;
	} else  {
		return <SimpleChatRoomPanel room={props.room} />;
	}
}

export {
	ChatRoomPanel
};