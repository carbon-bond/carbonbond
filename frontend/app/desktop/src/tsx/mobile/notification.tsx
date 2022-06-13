import * as React from 'react';
import { NotificationState } from '../global_state/notification';
import { UserState } from '../global_state/user';
import { NotificationList } from '../notification';

export function Notification(): JSX.Element {
	const { user_state } = UserState.useContainer();
	let {notifications, getNotificationNumber, readNotification} = NotificationState.useContainer();
	// 一開啓本組件即已讀
	if (getNotificationNumber(null) > 0) {
		readNotification(null);
	}
	if (user_state.login) {
		if (notifications) {
			return <div>
				<NotificationList notifications={notifications}	/>
			</div>;
		}
		return <div></div>;
	} else {
		return <div>您尚未登入</div>;
	}
}