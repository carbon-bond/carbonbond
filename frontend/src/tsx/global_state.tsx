import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import * as api from './api';

type UserStateType = { login: false, fetching: boolean } | { login: true, user_id: string };

function useUserState(): { user_state: UserStateType, set_login: Function, set_logout: Function } {
	let [user_state, setLogin] = useState<UserStateType>({ login: false, fetching: true });

	async function get_login_state(): Promise<{}> {
		const data = await api.me_request();
		if (data.me.id != null) {
			setLogin({ login: true, user_id: data.me.id });
		} else {
			setLogin({ login: false, fetching: false });
		}
		return {};
	}

	React.useEffect(() => {
		get_login_state();
	}, []);

	function set_login(user_id: string): void {
		setLogin({ login: true, user_id: user_id });
	}
	function set_logout(): void {
		setLogin({ login: false, fetching: false });
	}
	return { user_state, set_login, set_logout };
}

type ChatRoom = {
	// XXX: 之後要改爲 id ，因爲可能會撞名
	name: string,
};

function useBottomPanelState(): {
	chatrooms: ChatRoom[],
	add_room: Function,
	delete_room: Function
	} {
	let [chatrooms, set_chatrooms] = useState<ChatRoom[]>([]);

	function add_room(name: string): void {
		// TODO: 調整聊天室添加順序
		if (chatrooms.find(room => room.name == name) != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			chatrooms = chatrooms.filter(room => room.name != name);
			chatrooms = [{name}, ...chatrooms];
		} else {
			// NOTE: 是否該引入 immutable.js ?
			chatrooms = [{name}, ...chatrooms];
		}
		set_chatrooms(chatrooms);
	}

	function delete_room(name: string): void {
		set_chatrooms(chatrooms.filter(room => room.name != name));
	}

	return { chatrooms, add_room, delete_room };
}

export const UserState = createContainer(useUserState);
export const BottomPanelState = createContainer(useBottomPanelState);