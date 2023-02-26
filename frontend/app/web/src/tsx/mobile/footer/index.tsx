import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { MobileChatRoomPanel } from '../../chatroom_panel';
import { MobileEditor } from '../../editor_panel';
import { BottomPanelState, RoomKind, SimpleRoomData, ChosenBubble } from '../../global_state/bottom_panel';
import { AllChatState, DirectChatData } from '../../global_state/chat';
import { EditorPanelState } from '../../global_state/editor_panel';

function EditorBubble(): JSX.Element {
	const { editor_panel_data, openEditorPanel, setEmptyEditorData } = EditorPanelState.useContainer();
	const { chosen_bubble, setChosenBubble } = BottomPanelState.useContainer();
	const is_chosen = chosen_bubble?.kind == 'editor';
	const title = editor_panel_data ?
		editor_panel_data.title.length == 0 ?
			<i>未命名</i> : editor_panel_data.title
		: '';
	function onClick(): void {
		if (!is_chosen && editor_panel_data) {
			openEditorPanel();
			setChosenBubble({kind: 'editor'});
		} else if (!is_chosen && !editor_panel_data) {
			setEmptyEditorData();
			openEditorPanel();
			setChosenBubble({kind: 'editor'});
		} else if (is_chosen) {
			setChosenBubble(null);
		}
	}
	return <div
		className={`${style.editorBubble}`}
		onClick={onClick} >
		<span className={style.icon}>✏️</span>
		{title}
		{
			is_chosen ?
				<div className={style.triangle}></div> :
				<></>
		}
	</div>;
}

function ChatBubble(props: {
	chat: DirectChatData,
	onClick: () => void,
	is_chosen: boolean,
}): JSX.Element {
	return <div
		onClick={props.onClick}
		className={`${style.chatBubble} ${props.chat.isUnread() ? style.unread : ''}`}>
		{props.chat.toAvatar(style.avatar)}
		{
			props.is_chosen ?
				<div className={style.triangle}></div> :
				<></>
		}
	</div>;
}

function FooterPanel(props: {chosen: ChosenBubble | null}): JSX.Element {
	if (props.chosen == null) {
		return <></>;
	}
	switch (props.chosen.kind) {
		case 'chat': {
			return <MobileChatRoomPanel room={props.chosen.chatroom} />;
		}
		case 'editor': {
			return <MobileEditor />;
		}
		case 'is_init': {
			return <></>;
		}
	}
}

export function Footer(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	const { chatrooms, chosen_bubble, setChosenBubble } = BottomPanelState.useContainer();
	const { editor_panel_data } = EditorPanelState.useContainer();

	React.useEffect(() => {
		if (
			// 聊天室已關閉
			(chosen_bubble?.kind == 'chat' &&
				chatrooms.find(room => {
					return room.kind == RoomKind.Simple
						&& room.id == chosen_bubble.chatroom.id;
				}) == undefined
			) || (
			// 編輯器已關閉
				chosen_bubble?.kind == 'editor' && editor_panel_data == null
			)
		) {
			setChosenBubble(null);
		}
	}, [chatrooms, chosen_bubble, editor_panel_data, setChosenBubble]);

	function getPanelClassName(): string {
		if (chosen_bubble?.kind == 'is_init') {
			return style.panelInit;
		} else if (chosen_bubble == null) {
			return style.panelClose;
		} else {
			return style.panelOpen;
		}
	}

	function getFooterClassName(): string {
		if (chosen_bubble?.kind == 'is_init') {
			return style.footerInit;
		} else if (chosen_bubble == null) {
			return style.footerClose;
		} else {
			return style.footerOpen;
		}
	}


	return <>
		<div
			className={`${style.footer} ${getFooterClassName()}`}
		>
			<EditorBubble />
			{
				chatrooms.
					reduce((chats: [DirectChatData, SimpleRoomData][], room) => {
						if (room.kind == RoomKind.Simple) {
							const chat = all_chat.direct[room.id];
							chats.push([chat, room]);
						} else {
							console.warn('尚不支援含頻道聊天室');
						}
						return chats;
					}, [])
					.map(([chat, room]) => <ChatBubble
						key={chat.id}
						chat={chat}
						is_chosen={chosen_bubble?.kind == 'chat' && chosen_bubble.chatroom.id == room.id}
						onClick={() => {
							if (chosen_bubble == null
								|| chosen_bubble.kind != 'chat'
								|| (chosen_bubble.kind == 'chat' && chosen_bubble.chatroom.id != room.id)) {
								setChosenBubble({ kind: 'chat', chatroom: room });
							} else {
								setChosenBubble(null);
							}
						}} />)
			}
		</div >
		<div className={`${style.panel} ${getPanelClassName()}`}>
			<FooterPanel chosen={chosen_bubble} />
		</div>
	</>;
}
