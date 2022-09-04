import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { MobileChatRoomPanel } from '../../chatroom_panel';
import { BottomPanelState, RoomKind, SimpleRoomData, ChosenBubble } from '../../global_state/bottom_panel';
import { AllChatState, DirectChatData } from '../../global_state/chat';
// import { EditorPanelState } from '../../global_state/editor_panel';

function EditorBubble(): JSX.Element {
	// const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	return <div className={`${style.editorBubble}`}>
		<span className={style.icon}>✏️</span>
		發文
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
		<div className={style.triangle}></div>
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
			return <></>;
		}
	}
}

export function Footer(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let [is_init, set_is_init] = React.useState<boolean>(false);
	const { chatrooms, chosen_bubble, setChosenBubble } = BottomPanelState.useContainer();

	React.useEffect(() => {
		if (
			chatrooms.find(room => {
				return chosen_bubble
					&& chosen_bubble.kind == 'chat'
					&& room.kind == RoomKind.Simple
					&& room.id == chosen_bubble.chatroom.id;
			}) == undefined
		) {
			setChosenBubble(null);
		}
	}, [chatrooms, chosen_bubble, setChosenBubble]);

	function setChosen(chosen: ChosenBubble | null): void {
		set_is_init(false);
		setChosenBubble(chosen);
	}

	function getPanelClassName(): string {
		if (is_init) {
			return style.panelInit;
		} else if (chosen_bubble == null) {
			return style.panelClose;
		} else {
			return style.panelOpen;
		}
	}

	function getFooterClassName(): string {
		if (is_init) {
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
								setChosen({ kind: 'chat', chatroom: room });
							} else {
								setChosen(null);
							}
						}} />)
			}
		</div >
		<div className={`${style.panel} ${getPanelClassName()}`}>
			<FooterPanel chosen={chosen_bubble} />
		</div>
	</>;
}
