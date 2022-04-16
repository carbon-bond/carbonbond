import * as React from 'react';

import style from '../../css/header/index.module.css';

import { DropDown } from '../components/drop_down';
import { NotificationList } from '../notification';
import { mapQuality, NotificationQuality, NotificationState } from '../global_state/notification';

type Props = {
    icon: string,
    quality: NotificationQuality,
    expanding_quality: NotificationQuality | null,
    setExpandingQuality: (q: NotificationQuality | null) => void
};

export function NotificationIcon(props: Props): JSX.Element {
	let {notifications, getNotificationNumber, readNotification} = NotificationState.useContainer();

	function onClick(): void {
		if (props.expanding_quality == props.quality) {
			props.setExpandingQuality(null);
		} else {
			props.setExpandingQuality(props.quality);
			readNotification(props.quality);
		}
	}

	return <DropDown
		button={
			<div className={style.icon}>
				{props.icon}
				{
					(() => {
						let unread_count = getNotificationNumber(props.quality);
						if (unread_count > 0) {
							return <div className={style.unreadCount}>{unread_count}</div>;
						}
					})()
				}
			</div>
		}
		forced_expanded={props.expanding_quality == props.quality}
		onExtended={onClick}
		body={
			((): null | JSX.Element => {
				return <div className={`${style.notificationDropdown} ${style.dropdown}`}>
					<NotificationList notifications={notifications.filter(n => mapQuality(n.quality) == props.quality)} />
				</div>;
			})()
		}
	/>;
}