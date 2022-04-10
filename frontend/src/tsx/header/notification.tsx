import * as React from 'react';
import { Link } from 'react-router-dom';

import style from '../../css/header/index.module.css';

import { API_FETCHER } from '../../ts/api/api';
import { Notification, NotificationKind } from '../../ts/api/api_trait';
import { DropDown } from '../components/drop_down';
import produce from 'immer';
import { toastErr } from '../utils';
import { relativeDate } from '../../ts/date';
import { getBoardInfo } from '../board';

export enum NotificationQuality { Good, Bad, Neutral };

type Props = {
    icon: string,
    quality: NotificationQuality,
    expanding_quality: NotificationQuality | null,
	notifications: Notification[] | null,
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
				return <NotificationDropDown notifications={notifications} />;
			})()
		}
	/>;
}
function NotiRow<T>(props: { children: T, time?: Date }): JSX.Element {
	return <div className={style.row}>
		{
			props.time ? <>
				<div className={style.notificationSpace} />
				<div style={{ flex: 1 }} />
				<p className={style.time}>{relativeDate(props.time)}</p>
				<div className={style.notificationSpace} />
				<div style={{ flexBasis: '100%' }} />
			</> : null
		}

		<div className={style.notificationSpace} />
		<div className={style.notificationMessage}> {props.children} </div>
		<div className={style.notificationSpace} />
	</div>;
}
export function NotificationDropDown(props: { notifications: Notification[] }): JSX.Element {
	return <div className={`${style.dropdown} ${style.notificationDropdown}`} >
		<div className={style.features}>
			<div className={style.notificationRow}>
				{
					(() => {
						if (props.notifications.length == 0) {
							return <NotiRow>暫無通知</NotiRow>;
						}
					})()
				}
				{
					props.notifications.map((n, i) => {
						return <React.Fragment key={n.id}>
							{ i == 0 ? null : <hr className={style.notificationSep} /> }
							<NotificationBlock notification={n} />
						</React.Fragment>;
					})
				}
			</div>
		</div>
	</div>;
}

function replier_name(name: string | null): JSX.Element {
	if (name == null) {
		return <>匿名用戶</>;
	} else {
		return <Link to={`/app/user/${name}`}>
			{name}
		</Link>;
	}
}

export function NotificationBlock(props: { notification: Notification }): JSX.Element {
	let n = props.notification;
	function NotificationConcreteRow<T>(props: { children: T }): JSX.Element {
		return <NotiRow time={new Date(n.create_time)}>
			{props.children}
		</NotiRow>;
	}

	function ReplyNotification(props: { txt: string }): JSX.Element {
		if (n.board_name && n.board_type) {
			let board_info = getBoardInfo({ board_name: n.board_name, board_type: n.board_type });
			return <NotificationConcreteRow>
				{replier_name(n.user2_name)} 發文 <span className={style.tag}>{props.txt}</span> 了你在
				<Link to={board_info.to_url()}>{n.board_name}</Link>的文章
				<Link to={`${board_info.to_url()}/article/${n.article1_id!}`}>{n.article1_title}</Link>
			</NotificationConcreteRow>;
		} else {
			return <NotificationConcreteRow> 伺服器錯誤，回文通知不含有看板資訊，無法正確顯示通知 </NotificationConcreteRow>;
		}
	}
	function CommentNotification(): JSX.Element {
		if (n.board_name && n.board_type) {
			let board_info = getBoardInfo({ board_name: n.board_name, board_type: n.board_type });
			return <NotificationConcreteRow>
				{replier_name(n.user2_name)} 在
				<Link to={board_info.to_url()}>{n.board_name}</Link> 的文章
				<Link to={`${board_info.to_url()}/article/${n.article1_id!}`}>{n.article1_title}</Link>
				發佈了留言
			</NotificationConcreteRow>;
		} else {
			return <NotificationConcreteRow> 伺服器錯誤，留言通知不含有看板資訊，無法正確顯示通知 </NotificationConcreteRow>;
		}
	}
	switch (n.kind) {
		case NotificationKind.Follow:
			return <NotificationConcreteRow>{replier_name(n.user2_name)} 喜歡了你</NotificationConcreteRow>;
		case NotificationKind.Hate:
			return <NotificationConcreteRow>{replier_name(n.user2_name)} 仇視了你</NotificationConcreteRow>;
		case NotificationKind.ArticleBadReplied:
			return <ReplyNotification txt="戰" />;
		case NotificationKind.ArticleGoodReplied:
			return <ReplyNotification txt="挺" />;
		case NotificationKind.ArticleReplied:
			return <ReplyNotification txt="回應" />;
		case NotificationKind.CommentReplied:
			return <CommentNotification />;
	}
}