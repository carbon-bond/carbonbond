import * as React from 'react';
import { Link } from 'react-router-dom';

import style from '../css/notification.module.css';

import { Notification, NotificationKind } from '../ts/api/api_trait';
import { relativeDate } from '../ts/date';
import { getBoardInfo } from './board';

function NotificationRow<T>(props: { children: T, time?: Date }): JSX.Element {
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

export function NotificationList(props: { notifications: Notification[] }): JSX.Element {
	return <div className={style.features}>
		<div className={style.notificationRow}>
			{
				(() => {
					if (props.notifications.length == 0) {
						return <NotificationRow>暫無通知</NotificationRow>;
					} else {
						return props.notifications.map((n, i) => {
							return <React.Fragment key={n.id}>
								{i == 0 ? null : <hr className={style.notificationSeparater} />}
								<NotificationBlock notification={n} />
							</React.Fragment>;
						});
					}
				})()
			}
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
		return <NotificationRow time={new Date(n.create_time)}>
			{props.children}
		</NotificationRow>;
	}

	function ReplyNotification(props: { txt: string }): JSX.Element {
		if (n.board_name && n.board_type) {
			let board_info = getBoardInfo({ board_name: n.board_name, board_type: n.board_type });
			return <NotificationConcreteRow>
				{replier_name(n.user2_name)} 發文 <span className={style.tag}>{props.txt}</span> 了你在
				<Link to={board_info.to_url()}>{n.board_name}版</Link>的文章
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
				{replier_name(n.user2_name)} 在你
				<Link to={board_info.to_url()}>{n.board_name}版</Link>的文章
				<Link to={`${board_info.to_url()}/article/${n.article1_id!}`}>{n.article1_title}</Link>
				發佈了留言
			</NotificationConcreteRow>;
		} else {
			return <NotificationConcreteRow> 伺服器錯誤，留言通知不含有看板資訊，無法正確顯示通知 </NotificationConcreteRow>;
		}
	}
	function OtherCommentNotification(): JSX.Element {
		if (n.board_name && n.board_type) {
			let board_info = getBoardInfo({ board_name: n.board_name, board_type: n.board_type });
			return <NotificationConcreteRow>
				{replier_name(n.user2_name)} 也在
				<Link to={board_info.to_url()}>{n.board_name}版</Link>的文章
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
		case NotificationKind.OtherCommentReplied:
			return <OtherCommentNotification />;
	}
}