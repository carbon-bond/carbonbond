import * as React from 'react';

import style from '../../css/header/index.module.css';

import { API_FETCHER } from '../../ts/api/api';
import { Notification } from '../../ts/api/api_trait';
import { DropDown } from '../components/drop_down';
import produce from 'immer';
import { toastErr } from '../utils';
import { mapQuality, NotificationList, NotificationQuality } from '../notification';

type Props = {
    icon: string,
    quality: NotificationQuality,
    expanding_quality: NotificationQuality | null,
	notifications: Notification[] | null,
    setExpandingQuality: (q: NotificationQuality | null) => void
};

export function NotificationIcon(props: Props): JSX.Element {
	let [unread_count, setUnreadCount] = React.useState(0);
	let [notifications, setNotifications] = React.useState<Notification[]>([]);
	let [ready, setReady] = React.useState(false);
	React.useEffect(() => {
		if (props.notifications === null) {
			return;
		}
		let new_unread_cnt = 0;
		let new_arr = new Array<Notification>();
		for (let noti of props.notifications) {
			console.log(noti);
			if (mapQuality(noti.quality) == props.quality) {
				if (!noti.read) {
					new_unread_cnt++;
				}
				new_arr = produce(new_arr, nxt => {
					nxt.push(noti);
				});
			}
		}
		setUnreadCount(new_unread_cnt);
		setNotifications(new_arr);
		setReady(true);
	}, [props.notifications, props.quality]);

	function onClick(): void {
		if (props.expanding_quality == props.quality) {
			props.setExpandingQuality(null);
		} else {
			props.setExpandingQuality(props.quality);
			API_FETCHER.notificationQuery.readNotifications(notifications.map(n => n.id)).then(res => {
				if ('Err' in res) {
					toastErr(res.Err);
				} else {
					setUnreadCount(0);
				}
			});
		}
	}

	return <DropDown
		button={
			<div className={style.icon}>
				{props.icon}
				{
					(() => {
						if (unread_count > 0) {
							return <div className={style.unreadCount}>{unread_count}</div>;
						}
					})()
				}
			</div>
		}
		forced_expanded={props.expanding_quality == props.quality && ready}
		onExtended={onClick}
		body={
			((): null | JSX.Element => {
				return <div className={`${style.notificationDropdown} ${style.dropdown}`}>
					<NotificationList notifications={notifications} />
				</div>;
			})()
		}
	/>;
}