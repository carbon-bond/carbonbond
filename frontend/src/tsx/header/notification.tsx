import * as React from 'react';
import { Link } from 'react-router-dom';

import '../../css/header.css';

import { API_FETCHER } from '../../ts/api/api';
import { Notification, NotificationKind } from '../../ts/api/api_trait';
import { DropDown } from '../components/drop_down';
import produce from 'immer';
import { toastErr } from '../utils';

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
			console.log(props.expanding_quality, props.quality);
			props.setExpandingQuality(props.quality);
			API_FETCHER.readNotifications(notifications.map(n => n.id)).then(res => {
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
			<div styleName="icon">
				{props.icon}
				{
					(() => {
						if (unread_count > 0) {
							return <div styleName="unreadCount">{unread_count}</div>;
						}
					})()
				}
			</div>
		}
		forced_expanded={props.expanding_quality == props.quality}
		onExtended={onClick}
		body={
			((): null | JSX.Element => {
				return <NotificationDropDown notifications={notifications} />;
			})()
		}
	/>;
}
function NotiRow<T>(props: { children: T }): JSX.Element {
	return <div styleName="row">
		<div styleName="notificationSpace" />
		<div>{props.children}</div>
		<div styleName="notificationSpace" />
	</div>;
}
export function NotificationDropDown(props: { notifications: Notification[] }): JSX.Element {
	return <div styleName="dropdown">
		<div styleName="features">
			<div styleName="notificationRow">
				{
					(() => {
						if (props.notifications.length == 0) {
							return <NotiRow>暫無通知</NotiRow>;
						}
					})()
				}
				{
					props.notifications.map(n => {
						return <NotificationBlock key={n.id} notification={n} />;
					})
				}
			</div>
		</div>
	</div>;
}
export function NotificationBlock(props: { notification: Notification }): JSX.Element {
	let n = props.notification;
	function ReplyNoti(props: { txt: string }): JSX.Element {
		return <NotiRow>{n.user2_name!}{props.txt}了你在 <Link to={`/app/b/${n.board_name!}`}>{n.board_name!}</Link> 的文章 <Link to={`/app/b/${n.board_name!}/a/${n.article1_id!}`}>{n.article1_title}</Link> </NotiRow>;
	}
	switch (n.kind) {
		case NotificationKind.Follow:
			return <NotiRow>{n.user2_name!}追蹤了你</NotiRow>;
		case NotificationKind.Hate:
			return <NotiRow>{n.user2_name!}仇視了你</NotiRow>;
		case NotificationKind.ArticleBadReplied:
			return <ReplyNoti txt="戰" />;
		case NotificationKind.ArticleGoodReplied:
			return <ReplyNoti txt="挺" />;
		case NotificationKind.ArticleReplied:
			return <ReplyNoti txt="回" />;
	}
}