import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { BottomPanelState, RoomKind } from '../../global_state/bottom_panel';
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

export function Footer(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let [expanding, setExpanding] = React.useState<boolean | null>(null);
	const { chatrooms } = BottomPanelState.useContainer();

	function getPanelClassName(): string {
		if (expanding == null) {
			return style.panelInit;
		} else if (expanding == true) {
			return style.panelOpen;
		} else {
			return style.panelClose;
		}
	}

	function getFooterClassName(): string {
		if (expanding == null) {
			return style.footerInit;
		} else if (expanding == true) {
			return style.footerOpen;
		} else {
			return style.footerClose;
		}
	}

	return <>
		<div
			className={`${style.footer} ${getFooterClassName()}`}
		>
			{
				chatrooms.
				reduce((chats: DirectChatData[], room) => {
					if (room.kind == RoomKind.Simple) {
						const chat = all_chat.direct[room.id];
						if (chat.isUnread()) {
							chats.push(chat);
						}
					} else {
						console.warn('尚不支援含頻道聊天室');
					}
					return chats;
				}, [])
				.map(chat => <ChatBubble chat={chat} onClick={() => { setExpanding(!expanding); }} />)
			}
		</div >
		<div className={`${style.panel} ${getPanelClassName()}`}>
			面板
		</div>
	</>;
}
