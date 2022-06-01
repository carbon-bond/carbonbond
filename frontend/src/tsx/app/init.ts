import React from 'react';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import { UserState } from '../global_state/user';
import { SubscribedBoardsState } from '../global_state/subscribed_boards';
import { LocationState } from '../global_state/location';
import { AllChatState } from '../global_state/chat';
import { toast } from 'react-toastify';
import { ChatSocket } from '../../ts/chat_socket';
import { NotificationState } from '../global_state/notification';

export function useInit(): void {
	const { user_state, getLoginState } = UserState.useContainer();
	const { load, unload } = SubscribedBoardsState.useContainer();
	const { setNotifications } = NotificationState.useContainer();
	const all_chat_state = AllChatState.useContainer();
	const { current_location } = LocationState.useContainer();
	React.useEffect(() => {
		getLoginState();
		// eslint-disable-next-line
    }, []);
	React.useEffect(() => {
		(async () => {
			if (user_state.login) {
				try {
					let result = await API_FETCHER.userQuery.querySubcribedBoards();
					let boards = unwrap(result);
					load(boards);
				} catch (err) {
					toastErr(err);
				}
			} else {
				unload();
			}
		})();
	}, [load, unload, user_state.login]);
	React.useEffect(() => {
		(async () => {
			if (user_state.login) {
				try {
					let result = await API_FETCHER.notificationQuery.queryNotificationByUser(true);
					setNotifications(unwrap(result));
				} catch (err) {
					toastErr(err);
				}
			} else {
				setNotifications([]);
			}
		})();
	}, [setNotifications, user_state.login]);
	React.useEffect(() => {
		window.chat_socket.set_all_chat(all_chat_state);
	}, [all_chat_state]);
	React.useEffect(() => {
		let unread_number = all_chat_state.all_chat.unreadNumber();
		let show_unread = unread_number > 0 ? `(${unread_number}) ` : '';
		const location = current_location?.to_document_title() ?? '';
		document.title = `${show_unread}${location}`;
	}, [current_location, all_chat_state]);
}

declare global {
    interface Window { chat_socket: ChatSocket, is_mobile: boolean; }
}

export function init(args: { is_mobile: boolean }): void {
	// 配置全域提醒
	toast.configure({ position: 'bottom-right' });
	window.is_mobile = args.is_mobile;
	window.chat_socket = new ChatSocket();
}