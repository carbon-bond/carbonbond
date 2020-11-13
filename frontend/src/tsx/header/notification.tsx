import * as React from 'react';
import { toast } from 'react-toastify';

import '../../css/header.css';

import {  API_FETCHER } from '../../ts/api/api';
import { Notification, NotificationKind } from '../../ts/api/api_trait';
import produce from 'immer';

export enum NotificationQuality { Good, Bad, Neutral };

type Props = {
    icon: string,
    quality: NotificationQuality,
    expanding_quality: NotificationQuality | null,
    notifications: Notification[],
    setExpandingQuality: (q: NotificationQuality | null) => void
};

function mapQuality(b: boolean | null): NotificationQuality {
	if (typeof b === 'boolean') {
		return b ? NotificationQuality.Good : NotificationQuality.Bad;
	} else {
		return NotificationQuality.Neutral;
	}
}

export function NotificationIcon(props: Props): JSX.Element {
	let [unread_count, setUnreadCount] = React.useState(0);
	let [notifications, setNotifications] = React.useState<Notification[]>([]);
	React.useEffect(() => {
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
	}, [props.notifications, props.quality]);

	function onClick(): void {
		if (props.expanding_quality == props.quality) {
			props.setExpandingQuality(null);
		} else {
			props.setExpandingQuality(props.quality);
			API_FETCHER.readNotifications(notifications.map(n => n.id)).then(res => {
				if ('Err' in res) {
					toast.error(res.Err);
				} else {
					setUnreadCount(0);
				}
			});
		}
	}

	return <>
        <div styleName="icon" onClick={() => onClick()}>
        	{props.icon}
        	{
        		(() => {
        			if (unread_count > 0) {
        				return <div styleName="unreadCount">{unread_count}</div>;
        			}
        		})()
        	}
        </div>
        {
        	(() => {
        		if (props.expanding_quality == props.quality) {
        			return <NotificationDropDown notifications={notifications}/>;
        		}
        	})()
        }
    </>;
}
export function NotificationDropDown(props: { notifications: Notification[] }): JSX.Element {
	return <div styleName="dropdown">
		<div styleName="triangle"> </div>
		<div styleName="features">
			{
				(() => {
					if (props.notifications.length == 0) {
						return <div>暫無通知</div>;
					}
				})()
			}
			{
				props.notifications.map(n => {
					return <NotificationBlock key={n.id} notification={n}/>;
				})
			}
		</div>
	</div>;
}
export function NotificationBlock(props: { notification: Notification }): JSX.Element {
	let n = props.notification;
	switch (n.kind) {
		case NotificationKind.Follow:
			return <div>{n.user2_name!}追蹤了你</div>;
		case NotificationKind.Hate:
			return <div>{n.user2_name!}仇視了你</div>;
	}
}