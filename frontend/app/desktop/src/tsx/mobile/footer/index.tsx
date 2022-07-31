import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { ChatRoomPanelContent } from '../../chatroom_panel';
import { BottomPanelState, RoomKind, SimpleRoomData } from '../../global_state/bottom_panel';
import { AllChatState, DirectChatData } from '../../global_state/chat';

function ChatBubble(props: {
	chat: DirectChatData,
	onClick: () => void,
}): JSX.Element {
	return <div
		onClick={props.onClick}
		className={`${style.chatBubble} ${props.chat.isUnread() ? style.unread : ''}`}>
		{props.chat.toAvatar(style.avatar)}
	</div>;
}

type ChosenBubble = {
	kind: 'chat',
	chatroom: SimpleRoomData,
} | {
	kind: 'editor',
};

export function Footer(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let [is_init, set_is_init] = React.useState<boolean>(true);
	let [chosen, setChosen_] = React.useState<ChosenBubble | null>(null);
	const { chatrooms } = BottomPanelState.useContainer();

	function setChosen(chosen: ChosenBubble | null): void {
		set_is_init(false);
		setChosen_(chosen);
	}

	function getPanelClassName(): string {
		if (is_init) {
			return style.panelInit;
		} else if (chosen == null) {
			return style.panelClose;
		} else {
			return style.panelOpen;
		}
	}

	function getFooterClassName(): string {
		if (is_init) {
			return style.footerInit;
		} else if (chosen == null) {
			return style.footerClose;
		} else {
			return style.footerOpen;
		}
	}

	function FooterPanel(): JSX.Element {
		if (chosen == null) {
			return <></>;
		}
		switch (chosen.kind) {
			case 'chat': {
				return <ChatRoomPanelContent room={chosen.chatroom} />;
			}
			case 'editor': {
				return <></>;
			}
		}
	}

	return <>
		<div
			className={`${style.footer} ${getFooterClassName()}`}
		>
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
					.map(([chat, room]) => <ChatBubble key={chat.id} chat={chat} onClick={() => {
						if (chosen == null
							|| chosen.kind != 'chat'
							|| (chosen.kind == 'chat' && chosen.chatroom.id != room.id)) {
							setChosen({ kind: 'chat', chatroom: room });
						} else {
							setChosen(null);
						}
					}} />)
			}
		</div >
		<div className={`${style.panel} ${getPanelClassName()}`}>
			<FooterPanel />
		</div>
	</>;
}
