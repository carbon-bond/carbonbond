import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import * as api from './api';
import { produce } from 'immer';

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

export type Dialog = {
	who: string,
	content: string,
	date: Date
};

export type Chat = {
	name: string,
	dialogs: Dialog[]
};

type AllChat = {
	party: Chat[],
	group: Chat[],
	two_people: Chat[]
};

function useAllChatState(): {
	all_chat: AllChat
	add_dialog: Function
	} {

	let [all_chat, set_all_chat] = useState<AllChat>({
		party: [],
		group: [],
		// TODO: 刪掉假數據
		two_people: [
			{name: '玻璃碳', dialogs: [{ who: '金剛', content: '安安', date: new Date() }]},
			{name: '石墨', dialogs: [{ who: '石墨', content: '送出了一張貼圖', date: new Date(2019, 6, 12) }]},
			{name: '六方', dialogs: [{ who: '六方', content: '幫幫窩', date: new Date(2018, 6) }]},
			{name: '芙', dialogs: [{ who: '芙', content: '一直流鼻涕', date: new Date(2019, 6) }]},
		]
	});

	// 只作用於雙人
	function add_dialog(name: string, dialog: Dialog): void {
		let new_chat = produce(all_chat, draft => {
			let chat = draft.two_people.find((d) => d.name == name);
			if (chat != undefined) {
				chat!.dialogs.push(dialog);
			} else {
				console.warn(`不存在雙人對話 ${name}`);
			}
		});
		set_all_chat(new_chat);
	}

	return { all_chat: all_chat, add_dialog };
}

export const UserState = createContainer(useUserState);
export const BottomPanelState = createContainer(useBottomPanelState);
export const AllChatState = createContainer(useAllChatState);