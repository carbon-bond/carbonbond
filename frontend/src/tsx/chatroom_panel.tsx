import * as React from 'react';
import bottom_panel_style from '../css/bottom_panel/bottom_panel.module.css';
const {roomTitle, roomWidth, leftSet, middleSet, rightSet, button} = bottom_panel_style;
import style from '../css/bottom_panel/chat_room.module.css';
import { relativeDate } from '../ts/date';
import { differenceInMinutes } from 'date-fns';
import { useScrollBottom, useInputValue } from './utils';
import useOnClickOutside from 'use-onclickoutside';
import {
	AllChatState,
	IMessage,
	Message,
} from './global_state/chat';
import {
	BottomPanelState,
	RoomData,
	SimpleRoomData,
	ChannelRoomData,
	isChannelRoomData
} from './global_state/bottom_panel';
import { isEmojis, isLink, isImageLink } from '../ts/regex_util';
import 'emoji-mart/css/emoji-mart.css';
import * as EmojiMart from 'emoji-mart';
import { UserState } from './global_state/user';

const Picker = React.lazy(() => {
	return import('emoji-mart')
		.then(({ Picker }) => ({ default: Picker }));
});

type AggMessage = {
	who: string,
	date: Date,
	contents: string[]
};

function aggregateMessages(messages: IMessage[]): AggMessage[] {
	if (messages.length == 0) {
		return [];
	}
	let tmp = {
		who: messages[0].sender_name,
		date: messages[0].time,
		contents: [messages[0].content]
	};
	if (messages.length == 1) {
		return [tmp];
	}
	const ret: AggMessage[] = [];
	let cur_date = tmp.date;
	for (let i = 1; i < messages.length; i++) {
		// 如果作者相同、上下兩則訊息相距不到一分鐘，則在 UI 上合併
		const message = messages[i];
		if (tmp.who == message.sender_name && differenceInMinutes(message.time, cur_date) < 1) {
			tmp.contents.push(message.content);
		} else {
			ret.push(tmp);
			tmp = {
				who: message.sender_name,
				date: message.time,
				contents: [message.content]
			};
		}
		cur_date = message.time;
	}
	ret.push(tmp);
	return ret;
}

function MessageShow(props: { content: string }): JSX.Element {
	if (isEmojis(props.content)) {
		return <div className={style.emojis}>{props.content}</div>;
	} else if (isImageLink(props.content)) {
		// 注意：如果是 ImageLink ，那必定是 Link ，所以本分支要先判斷
		return <div>
			<div className={style.normal}><a href={props.content} target="_blank">{props.content}</a></div>
			<div className={style.image}><img src={props.content} /></div>
		</div>;
	} else if (isLink(props.content)) {
		return <div className={style.normal}>
			<a href={props.content} target="_blank">{props.content}</a>
		</div>;
	} else {
		return <div className={style.normal}>{props.content}</div>;
	}
}

const MessageBlocks = React.memo((props: {messages: IMessage[]}): JSX.Element => {
	const agg_messages = aggregateMessages(props.messages);
	return <>
	{
		// XXX: key 要改成能表示時間順序的 id
		agg_messages.map(message => <div key={Number(message.date)} className={style.messageBlock}>
			<div className={style.meta}>
				<span className={style.who}>{message.who}</span>
				<span className={style.date}>{relativeDate(message.date)}</span>
			</div>
			{
				message.contents.map((content, index) => {
					return <MessageShow content={content} key={index} />;
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

function InputBar(props: InputBarProp): JSX.Element {
	const inputElement = React.useRef<HTMLInputElement>(null);
	const [extendEmoji, setExtendEmoji] = React.useState(false);
	const ref = React.useRef(null);
	useOnClickOutside(ref, () => setExtendEmoji(false));

	function onSelect(emoji: EmojiMart.EmojiData): void {
		if (inputElement.current) {  // 判斷式只是為了 TS 的型別檢查
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
				let em = (emoji as Emoji).native;
				const new_value = left + em + right;
				window.requestAnimationFrame(() => {
					inputElement.current!.selectionStart = start + em.length;
					inputElement.current!.selectionEnd = start + em.length;
				});
				props.setValue(new_value);
			}
		}
	}

	function onKeyDownWrap(e: React.KeyboardEvent<HTMLInputElement>): void {
		props.onKeyDown(e);
		setExtendEmoji(false);
	}

	function onClick(): void {
		if (inputElement.current) {  // 判斷式只是為了 TS 的型別檢查
			inputElement.current.focus();
		}
		setExtendEmoji(!extendEmoji);
	}

	return <div className={style.inputBar}>
		<div className={style.nonText} ref={ref}>
			<div onClick={onClick}>😎</div>
			{
				extendEmoji ?
					<React.Suspense fallback={<div className={style.loading}>載入中...</div>}>
						<div className={style.emojiPicker}>
							<Picker
								native={true}
								showPreview={false}
								showSkinTones={false}
								onSelect={onSelect} />
						</div>
					</React.Suspense> :
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
	const { all_chat, addMessage, updateLastRead } = AllChatState.useContainer();
	const [extended, setExtended] = React.useState(true);
	const { input_props, setValue } = useInputValue('');
	const scroll_bottom_ref = useScrollBottom();
	const { user_state } = UserState.useContainer();
	const chat = all_chat.direct.find(c => c.name == props.room.name);
	if (chat == undefined) { console.error(`找不到聊天室 ${props.room.name}`);}
	React.useEffect(() => {
		if (extended && chat!.isUnread()) {
			updateLastRead(props.room.name, new Date());
		}
	}, [extended, chat, updateLastRead, props.room.name]);

	if (user_state.login == false) {
		return <></>;
	}

	if (extended) {

		const sender_name = user_state.user_name;
		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				const now = new Date();
				window.chat_socket.send_message(chat!.id, input_props.value);
				addMessage(props.room.name, new Message({
					sender_name,
					content: input_props.value,
					time: now,
				}));
				setValue('');
			}
		}

		return <div className={style.chatPanel}>
			<div className={roomTitle}>
				<div className={leftSet}>{props.room.name}</div>
				<div className={middleSet} onClick={() => setExtended(false)}></div>
				<div className={rightSet}>
					<div className={button}>⚙</div>
					<div className={button} onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
			<div ref={scroll_bottom_ref} className={style.messages}>
				<MessageBlocks messages={chat!.history.toJS()}/>
			</div>
			<InputBar input_props={input_props} setValue={setValue} onKeyDown={onKeyDown}/>
		</div>;
	} else {
		return <div className={`${style.chatPanel} ${roomWidth}`}>
			<div className={roomTitle}>
				<div className={leftSet}>{props.room.name}</div>
				<div className={middleSet} onClick={() => setExtended(true)}></div>
				<div className={rightSet}>
					<div className={button} onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
		</div>;
	}
}

function ChannelChatRoomPanel(props: {room: ChannelRoomData}): JSX.Element {
	const { deleteRoom, changeChannel } = BottomPanelState.useContainer();
	const { all_chat, addChannelMessage, updateLastReadChannel } = AllChatState.useContainer();
	const [extended, setExtended] = React.useState(true);
	const { input_props, setValue } = useInputValue('');
	const scroll_bottom_ref = useScrollBottom();
	const { user_state } = UserState.useContainer();

	const chat = all_chat.group.find(c => c.name == props.room.name);
	if (chat == undefined) { console.error(`找不到聊天室 ${props.room.name}`); }
	const channel = chat!.channels.find(c => c.name == props.room.channel);
	if (channel == undefined) { console.error(`找不到頻道 ${props.room.channel}`); }

	React.useEffect(() => {
		if (extended && channel!.isUnread()) {
			updateLastReadChannel(props.room.name, props.room.channel, new Date());
		}
	}, [extended, channel, updateLastReadChannel, props.room.name, props.room.channel]);

	if (user_state.login == false) {
		return <></>;
	}

	if (extended) {

		const sender_name = user_state.user_name;
		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				const now = new Date();
				console.log(props.room.channel);
				addChannelMessage(props.room.name, props.room.channel, new Message({
					sender_name,
					content: input_props.value,
					time: now,
				}));
				setValue('');
			}
		}

		function ChannelList(): JSX.Element {
			return <div className={style.channelList}>
				{
					chat!.channels.valueSeq().map(c => {
						const is_current = c.name == channel!.name;
						const channel_style = `${channel} ${is_current ? style.selected : ''}`;
						return <div className={channel_style} key={c.name} onClick={() => { changeChannel(chat!.name, c.name); }}>
							<span className={style.channelSymbol}># </span>
							{c.name}
						</div>;
					}).toJS()
				}
			</div>;
		}

		return <div className={style.chatPanel}>
			<div className={roomTitle}>
				<div className={leftSet}>{props.room.name}</div>
				<div className={middleSet} onClick={() => setExtended(false)}>#{props.room.channel}</div>
				<div className={rightSet}>
					<div className={button}>⚙</div>
					<div className={button} onClick={() => deleteRoom(props.room.name)}>✗</div>
				</div>
			</div>
			<div className={style.panelContent}>
				<div className={style.channels}>
					<div className={style.channelControl}>
						<div className={leftSet}>頻道列表</div>
						<div className={rightSet}>➕</div>
					</div>
					<ChannelList />
				</div>
				<div>
					<div ref={scroll_bottom_ref} className={style.messages}>
						<MessageBlocks messages={channel!.history.toJS()} />
					</div>
					<InputBar input_props={input_props} setValue={setValue} onKeyDown={onKeyDown}/>
				</div>
			</div>
		</div>;
	} else {
		return <div className={`${style.chatPanel} ${roomWidth}`}>
			<div className={roomTitle}>
				<div className={leftSet}>{props.room.name}</div>
				<div className={middleSet} onClick={() => setExtended(true)}>#{props.room.channel}</div>
				<div className={rightSet}>
					<div className={button} onClick={() => deleteRoom(props.room.name)}>✗</div>
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