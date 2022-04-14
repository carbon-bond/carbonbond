import * as React from 'react';
import { UserState } from '../global_state/user';
import { NotificationList, useNotification } from '../notification';

export function Notification(): JSX.Element {
	const { user_state } = UserState.useContainer();
	let notifications = useNotification(user_state.login);
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