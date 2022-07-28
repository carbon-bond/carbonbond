import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { AllChatState, ChatData } from '../../global_state/chat';

export function Footer(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	// let [expanding, setExpanding] = React.useState<boolean>();
	let chat_array: ChatData[] = Array.from(Object.values(all_chat.direct));
	return <div className={style.footer}>
		{
			chat_array.filter(chat => chat.isUnread()).map(chat => {
				return <div
					key={chat.id}
					className={`${style.avatar} ${style.unread}`}>
					{chat.toAvatar(style.avatar)}
				</div>;
			})
		}
	</div>;
}
