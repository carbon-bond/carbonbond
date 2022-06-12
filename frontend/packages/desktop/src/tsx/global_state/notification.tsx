import { API_FETCHER } from '../../ts/api/api';
import * as React from 'react';
import { createContainer } from 'unstated-next';
import { toastErr } from '../utils';
import { Notification } from '../../ts/api/api_trait';
import produce from 'immer';
const { useState } = React;

export enum NotificationQuality { Good, Bad, Neutral };

export function mapQuality(b: boolean | null): NotificationQuality {
	if (typeof b === 'boolean') {
		return b ? NotificationQuality.Good : NotificationQuality.Bad;
	} else {
		return NotificationQuality.Neutral;
	}
}

function useNotificationState(): {
	getNotification: () => void,
	notifications: Notification[],
	setNotifications: (notifications: Notification[]) => void
	getNotificationNumber: (quality: NotificationQuality | null) => number,
	readNotification: (quality: NotificationQuality | null) => Promise<void>
	} {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	async function getNotification(): Promise<void> {
		return API_FETCHER.notificationQuery.queryNotificationByUser(true).then((res) => {
			if ('Err' in res) {
				toastErr(res.Err);
				return;
			}
			setNotifications(res.Ok);
		});
	}

	function unreadMatch(quality: NotificationQuality | null, notification: Notification): boolean {
		return !notification.read && (quality == null || mapQuality(notification.quality) == quality);
	}

	function getNotificationNumber(quality: NotificationQuality | null): number {
		if (quality == null) {
			return notifications.filter(n => !n.read).length;
		} else {
			return notifications.filter(n => unreadMatch(quality, n)).length;
		}
	}

	async function readNotification(quality: NotificationQuality | null): Promise<void> {
		return API_FETCHER.notificationQuery.readNotifications(
			notifications
				.filter(n => unreadMatch(quality, n))
				.map(n => n.id)
		).then(res => {
			if ('Err' in res) {
				toastErr(res.Err);
			} else {
				let new_notifications = produce(notifications, notifications => {
					notifications.filter(n => unreadMatch(quality, n)).forEach(notification => {
						notification.read = true;
					});
				});
				setNotifications(new_notifications);
			}
		});
	}

	return {notifications, setNotifications, getNotification, getNotificationNumber, readNotification};
}

export const NotificationState = createContainer(useNotificationState);