import * as React from 'react';
import bottom_panel_style from '../css/bottom_panel/bottom_panel.module.css';
const {roomTitle, roomWidth, leftSet, middleSet, rightSet, button} = bottom_panel_style;
import style from '../css/bottom_panel/chat_room.module.css';
import { relativeDate } from '../ts/date';
import { differenceInMinutes } from 'date-fns';
import { useScrollBottom, useInputValue, toastErr, useFocus } from './utils';
import useOnClickOutside from 'use-onclickoutside';
import {
	AllChatState,
	OppositeKind,
	IMessage,
	Message,
	DirectChatData,
} from './global_state/chat';
import {
	BottomPanelState,
	RoomData,
	SimpleRoomData,
	ChannelRoomData,
	isChannelRoomData,
	RoomKind
} from './global_state/bottom_panel';
import { isEmojis, isImageLink } from '../ts/regex_util';
import 'emoji-mart/css/emoji-mart.css';
import * as EmojiMart from 'emoji-mart';
import { UserState } from './global_state/user';
import { API_FETCHER, unwrap } from '../ts/api/api';
import produce from 'immer';
import { Link } from 'react-router-dom';
import { NewChat, server_trigger } from '../ts/api/api_trait';
import { useScroll } from 'react-use';
import ReactDOM from 'react-dom';
import { ShowLine } from './display/show_text';

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
		who: messages[0].sender,
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
		if (tmp.who == message.sender && differenceInMinutes(message.time, cur_date) < 1) {
			tmp.contents.push(message.content);
		} else {
			ret.push(tmp);
			tmp = {
				who: message.sender,
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
	} else {
		return <div className={style.normal}><ShowLine line={props.content} /></div>;
	}
}

const MessageBlocks = React.memo((props: {
	chat: DirectChatData
	messages: IMessage[],
	user_name: string,
	room_name: string
}): JSX.Element => {
	const agg_messages = aggregateMessages(props.messages);
	const OppositeImage = (() => {
		switch (props.chat.meta.opposite.kind) {
			case OppositeKind.Direct:
				return <Link to={props.chat.getURL()}>
					<img src={`/avatar/${props.room_name}`} />
				</Link>;
			case OppositeKind.AnonymousArticleMeta:
				return <Link to={props.chat.getURL()}>
					<img src={'/no-avatar.png'} />
				</Link>;
		}
	})();
	const MyImage = <Link to={`/app/user/${props.user_name}`}>
		<img src={`/avatar/${props.user_name}`} />
	</Link>;
	const OppositeLink = <Link to={props.chat.getURL()}>
		<span className={style.who}>{props.room_name}</span>
	</Link>;
	const MyLink = <Link to={`/app/user/${props.user_name}`}>
		<span className={style.who}>{props.user_name}</span>
	</Link>;

	return <>
		{
			// XXX: key 要改成能表示時間順序的 id
			agg_messages.map(message => {
				const Image = (() => {
					switch (message.who) {
						case server_trigger.Sender.Myself:
							return MyImage;
						case server_trigger.Sender.Opposite:
							return OppositeImage;
					}
				})();
				const SenderLink = (() => {
					switch (message.who) {
						case server_trigger.Sender.Myself:
							return MyLink;
						case server_trigger.Sender.Opposite:
							return OppositeLink;
					}
				})();
				return <div key={Number(message.date)} className={style.messageBlock}>
					<div className={style.leftSet}>{Image}</div>
					<div className={style.rightSet}>
						<div className={style.meta}>
							{SenderLink}
							<span className={style.date}>{relativeDate(message.date)}</span>
						</div>
						{
							message.contents.map((content, index) => {
								return <MessageShow content={content} key={index} />;
							})
						}
					</div>
				</div>;
			})
		}
	</>;
});

type InputEvent = React.ChangeEvent<HTMLInputElement>;

type InputBarProp = {
	input_props: {
		onChange: (e: InputEvent) => void,
		value: string
	},
	setValue: React.Dispatch<React.SetStateAction<string>>,
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
	input_ref: React.RefObject<HTMLInputElement>,
};

type Emoji = {
	native: string
};

function InputBar(props: InputBarProp): JSX.Element {
	const input_ref = props.input_ref;
	const [extendEmoji, setExtendEmoji] = React.useState(false);
	const ref = React.useRef(null);
	useOnClickOutside(ref, () => setExtendEmoji(false));

	function onSelect(emoji: EmojiMart.EmojiData): void {
		if (input_ref.current) {  // 判斷式只是為了 TS 的型別檢查
			input_ref.current.focus();
			const value = props.input_props.value;
			const start = input_ref.current.selectionStart;
			const end = input_ref.current.selectionEnd;
			if (start == null || end == null) {
				const new_value = value + (emoji as Emoji).native;
				props.setValue(new_value);
			} else {
				const left = value.slice(0, start);
				const right = value.slice(end);
				let em = (emoji as Emoji).native;
				const new_value = left + em + right;
				window.requestAnimationFrame(() => {
					input_ref.current!.selectionStart = start + em.length;
					input_ref.current!.selectionEnd = start + em.length;
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
		if (input_ref.current) {  // 判斷式只是為了 TS 的型別檢查
			input_ref.current.focus();
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
			ref={input_ref}
			onKeyDown={onKeyDownWrap}
			type="text"
			placeholder="輸入訊息..."
			autoFocus
		/>
	</div>;
}

// 聊天室
function SimpleChatRoomPanel(props: {room: SimpleRoomData}): JSX.Element {
	const { deleteRoom, toRealRoom } = BottomPanelState.useContainer();
	const { all_chat, addMessage, updateLastRead, setAllChat } = AllChatState.useContainer();
	const [extended, setExtended] = React.useState(true);
	const [scrolling, setScrolling] = React.useState(false);
	const [fetchingHistory, setFetchingHistory] = React.useState(false);
	const [initializing, setInitializing] = React.useState(true);
	const [prev_scroll_top, setPrevScrollTop] = React.useState(0);
	const { input_props, setValue } = useInputValue('');
	const [ref, scrollToBottom] = useScrollBottom();
	const {y} = useScroll(ref);
	const { user_state } = UserState.useContainer();
	const chat = all_chat.direct[props.room.id];
	const [input_ref, setInputFocus] = useFocus();
	const [toggle_focus_test, setToggleFocusTest] = React.useState(false);
	React.useEffect(() => {
		if (extended && chat?.isUnread() && document.activeElement === input_ref?.current && document.hasFocus()) {
			let now = new Date();
			updateLastRead(props.room.id, now);
			API_FETCHER.chatQuery.updateReadTime(chat.id).then(res => unwrap(res)).catch(err => {
				console.error(`更新聊天室 ${chat.name} 讀取時間失敗：`);
				console.error(err);
			});
		}
	}, [extended, chat, updateLastRead, props.room.id, input_ref, toggle_focus_test]);

	React.useEffect(() => {
		if (scrolling) {
			setScrolling(false);
			scrollToBottom();
		}
		if (initializing) {
			setInitializing(false);
			setScrolling(true);
		}
	}, [scrolling, scrollToBottom, initializing]);

	React.useEffect(() => {
		if (extended && ref.current) {
			ref.current.scrollTop = prev_scroll_top;
		}
	}, [extended, prev_scroll_top, ref]);

	// 如果聊天室本就捲動至底部，收到訊息時，捲動至底部
	React.useEffect(() => {
		// XXX: 55 是實驗出來的數字
		// 一旦 CSS 有所更動就可能失效
		// https://stackoverflow.com/questions/876115/how-can-i-determine-if-a-div-is-scrolled-to-the-bottom
		if (chat.history.length > 0
			&& chat.history[chat.history.length - 1].sender == server_trigger.Sender.Opposite
			&& ref.current
			&& ref.current.scrollHeight - ref.current.clientHeight - ref.current.scrollTop <= 55) {
			setScrolling(true);
		}
	}, [chat.history, ref]);

	React.useEffect(() => {
		const PAGE_SIZE = 50;
		if (y < 200 && extended && !chat.exhaust_history && chat.isExist() && !fetchingHistory) {
			setFetchingHistory(true);
			API_FETCHER.chatQuery.queryDirectChatHistory(chat.id, chat.history[0].id, PAGE_SIZE).then(res => {
				let history = unwrap(res);
				let old_messages = history.map(m => {
					return new Message(m.id, m.sender, m.text, new Date(m.time));
				});
				setAllChat(previous_all_chat => produce(previous_all_chat, (draft) => {
					// TODO: 給出真實的 message ID
					return draft.addOldMessages(props.room.id, old_messages);
				}));
				if (initializing) {
					setInitializing(false);
					scrollToBottom();
				}
				setFetchingHistory(false);
			}).catch(err => {
				toastErr(err);
				setFetchingHistory(false);
			});
		}
	}, [fetchingHistory, chat.exhaust_history, chat.history, chat.id, extended, props.room.id, scrollToBottom, setAllChat, y, initializing, chat]);

	if (user_state.login == false) {
		return <></>;
	}

	if (chat == undefined) {
		console.log('找不到聊天室');
		return <></>;
	}

	if (extended) {
		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				const now = new Date();
				if (chat.isExist()) {
					window.chat_socket.send_message(chat!.id, input_props.value);
					// TODO: 計算回傳的 id
					addMessage(props.room.id, new Message(-1, server_trigger.Sender.Myself, input_props.value, now));
					setValue('');
					setScrolling(true);
				} else {
					let new_chat: NewChat = (() => {
						switch (chat.meta.opposite.kind) {
							case OppositeKind.Direct:
								return { User: chat.meta.opposite.opposite_id };
							case OppositeKind.AnonymousArticleMeta:
								return { AnonymousArticle: chat.meta.opposite.article_id };
						}
					})();
					API_FETCHER.chatQuery.createChatIfNotExist(new_chat, input_props.value).then(res => {
						return unwrap(res);
					}).then(chat_id => {
						ReactDOM.unstable_batchedUpdates(() => {
							setAllChat(previous_all_chat => produce(previous_all_chat, (draft) => {
								// TODO: 給出真實的 message ID
								let ret = draft.addMessage(props.room.id,  new Message(-1, server_trigger.Sender.Myself, input_props.value, now));
								ret = ret.toRealDirectChat(props.room.id, chat_id);
								return ret;
							}));
							toRealRoom(props.room.id, chat_id);
						});
					}).catch(err => toastErr(err));
					setValue('');
					setScrolling(true);
				}
			}
		}

		function focusPanel(): void {
			setInputFocus();
			setToggleFocusTest(!toggle_focus_test);
		}

		return <div className={style.chatPanel} onClick={focusPanel}>
			<div className={roomTitle}>
				<div className={leftSet}>{chat.getLink()}</div>
				<div className={middleSet} onClick={() => {
					if (ref.current) {
						setPrevScrollTop(ref.current?.scrollTop);
					}
					setExtended(false);
				}}></div>
				<div className={rightSet}>
					{/* <div className={button}>⚙</div> */}
					<div className={button} onClick={() => deleteRoom(props.room.id, RoomKind.Simple)}>✗</div>
				</div>
			</div>
			<div ref={ref} className={style.messages}>
				<MessageBlocks messages={chat!.history} chat={chat} user_name={user_state.user_name} room_name={chat.name}/>
			</div>
			<InputBar input_props={input_props} setValue={setValue} onKeyDown={onKeyDown} input_ref={input_ref}/>
		</div>;
	} else {
		return <div className={`${style.chatPanel} ${roomWidth}`}>
			<div className={roomTitle}>
				<div className={leftSet}>{chat.name}</div>
				<div className={middleSet} onClick={() => setExtended(true)}></div>
				<div className={rightSet}>
					<div className={button} onClick={() => deleteRoom(props.room.id, RoomKind.Simple)}>✗</div>
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
	const [ref, _scrollToBottom] = useScrollBottom();
	const { user_state } = UserState.useContainer();
	const [input_ref, _setInputFocus] = useFocus();

	const chat = all_chat.group[props.room.id];
	if (chat == undefined) { console.error(`找不到含頻道聊天室 ${props.room.id}`); }
	const channel = chat!.channels[props.room.channel];
	if (channel == undefined) { console.error(`找不到頻道 ${props.room.channel}`); }

	React.useEffect(() => {
		if (extended && channel!.isUnread()) {
			updateLastReadChannel(props.room.id, props.room.channel, new Date());
		}
	}, [extended, channel, updateLastReadChannel, props.room.id, props.room.channel]);

	if (user_state.login == false) {
		return <></>;
	}

	if (extended) {

		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter' && input_props.value.length > 0) {
				const now = new Date();
				addChannelMessage(props.room.id, props.room.channel, new Message(
					-1,
					server_trigger.Sender.Myself,
					input_props.value,
					now
				));
				setValue('');
			}
		}

		function ChannelList(): JSX.Element {
			return <div className={style.channelList}>
				{
					Object.values(chat!.channels).map(c => {
						const is_current = c.name == channel!.name;
						const channel_style = `${channel} ${is_current ? style.selected : ''}`;
						return <div className={channel_style} key={c.name} onClick={() => { changeChannel(chat!.id, c.name); }}>
							<span className={style.channelSymbol}># </span>
							{c.name}
						</div>;
					})
				}
			</div>;
		}

		return <div className={style.chatPanel}>
			<div className={roomTitle}>
				<div className={leftSet}>{chat.name}</div>
				<div className={middleSet} onClick={() => setExtended(false)}>#{props.room.channel}</div>
				<div className={rightSet}>
					<div className={button}>⚙</div>
					<div className={button} onClick={() => deleteRoom(props.room.id, RoomKind.Channel)}>✗</div>
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
					<div ref={ref} className={style.messages}>
						{/* TODO: channel 運作方式與私訊不同*/}
						{/* <MessageBlocks messages={channel!.history} user_name={user_state.user_name} room_name="待修正" /> */}
					</div>
					<InputBar input_props={input_props} setValue={setValue} onKeyDown={onKeyDown} input_ref={input_ref}/>
				</div>
			</div>
		</div>;
	} else {
		return <div className={`${style.chatPanel} ${roomWidth}`}>
			<div className={roomTitle}>
				<div className={leftSet}>{chat.name}</div>
				<div className={middleSet} onClick={() => setExtended(true)}>#{props.room.channel}</div>
				<div className={rightSet}>
					<div className={button} onClick={() => deleteRoom(props.room.id, RoomKind.Channel)}>✗</div>
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
