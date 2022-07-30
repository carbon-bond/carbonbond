import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { AllChatState, ChatData } from '../../global_state/chat';

export function Footer(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let [expanding, setExpanding] = React.useState<boolean | null>(null);
	let chat_array: ChatData[] = Array.from(Object.values(all_chat.direct));

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
				chat_array.filter(chat => chat.isUnread()).map(chat => {
					return <div
						key={chat.id}
						onClick={() => {
							console.log('click');
							setExpanding(!expanding);
						}}
						className={`${style.avatar} ${style.unread}`}>
						{chat.toAvatar(style.avatar)}
					</div>;
				})
			}
		</div >
		<div className={`${style.panel} ${getPanelClassName()}`}>
			面板
		</div>
	</>;
}
