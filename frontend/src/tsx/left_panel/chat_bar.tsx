import * as React from 'react';
import style from '../../css/left_panel/chat_bar.module.css';
import { AllChatState, ChatData, DirectChatData, GroupChatData } from '../global_state/chat';
import { BottomPanelState } from '../global_state/bottom_panel';
import { roughDate } from '../../ts/date';
import { server_trigger } from '../../ts/api/api_trait';
import { UserState } from '../global_state/user';
import { toastErr } from '../utils';

function ChatUnit(props: { chat: ChatData }): JSX.Element {
	const { addRoom, addRoomWithChannel } = BottomPanelState.useContainer();
	const { user_state } = UserState.useContainer();
	const message = props.chat.newestMessage()!;
	const is_unread = props.chat.isUnread();

	if (user_state.login == false) {
		toastErr('邏輯錯誤，未登入但聊天室有資料');
		return <div>需登入</div>;
	}

	let UnreadInfo: JSX.Element = (() => {
		if (props.chat instanceof DirectChatData) {
			return <div className={style.lastMessage}>
				<span>{message.sender == server_trigger.Sender.Myself ? user_state.user_name : props.chat.name}</span>
				：
				<span>{message.content}</span>
			</div>;
		} else if (props.chat instanceof GroupChatData) {
			let channels = props.chat.unreadChannels();
			return <div className={style.unreadChannels}>
				{
					channels.length == 0 ?
						<span className={style.allRead}>所有頻道訊息皆已讀取</span> :
						channels.map(c => {
							return <span key={c.name} className={style.channel}>#{c.name}</span>;
						})
				}
			</div>;
		} else {
			console.error(`未知的 ChatData 介面：${typeof props.chat}`);
			return <></>;
		}
	})();

	function LastDate(): JSX.Element {
		const date = roughDate(message.time);
		if (is_unread) {
			return <div className={style.date}><span className={style.circle}>⬤</span> {date}</div>;
		} else {
			return <div className={style.date}>{date}</div>;
		}
	}

	function onClick(): void {
		if (props.chat instanceof DirectChatData) {
			addRoom(props.chat.id);
		} else if (props.chat instanceof GroupChatData) {
			if (props.chat.unreadChannels().length == 0) {
				addRoomWithChannel(props.chat.id, Object.values(props.chat.channels)[0].name);
			} else {
				addRoomWithChannel(props.chat.id, Object.values(props.chat.unreadChannels())[0].name);
			}
		}
	}

	return <div className={`${style.chatUnit} ${is_unread ? style.bold : ''}`} onClick={onClick}>
		<div className={style.upSet}>
			<div className={style.title}>
				<span className={style.name}>{props.chat.name}</span>
			</div>
			<LastDate />
		</div>
		<div className={style.downSet}>
			{UnreadInfo}
		</div>
	</div>;
}

// NOTE: 在每次更新數據時都維護排序，就無需在組件渲染時才排序
const date_cmp = (x: ChatData, y: ChatData): number => {
	const x_msg = x.newestMessage();
	const y_msg = y.newestMessage();
	if (x_msg == undefined || y_msg == undefined) {
		throw new Error('無歷史記錄');
	}
	return Number(y_msg!.time) - Number(x_msg!.time);
};

function ChatBar(): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	let chat_array: ChatData[] = Array.from(Object.values(all_chat.direct));
	chat_array = chat_array.concat(Array.from(Object.values(all_chat.group)));
	chat_array = chat_array.filter(chat => chat.isExist() === true);
	return <div className={style.chatbar}>
		{/* TODO: 尋找聊天室 */}
		{/* <input type="text" placeholder="🔍 尋找對話" /> */}
		{
			chat_array.sort(date_cmp).map((chat) => <ChatUnit key={chat.id} chat={chat} />)
		}
	</div>;
}

export {
	ChatBar
};