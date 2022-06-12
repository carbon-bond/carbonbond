import { API_FETCHER, unwrap } from '../../ts/api/api';
import * as React from 'react';
import { createContainer } from 'unstated-next';
import { toastErr } from '../utils';
import { AllChatState } from './chat';
import { BottomPanelState } from './bottom_panel';
const { useState } = React;

export type UserStateType = {
	login: false, fetching: boolean
} | {
	login: true,
	id: number,
	user_name: string,
	email: string,
	energy: number
};

interface LoginData {
	id: number,
	user_name: string,
	email: string,
	energy: number
}

function useUserState(): { user_state: UserStateType, setLogin: (data: LoginData) => void, setLogout: Function, getLoginState: Function } {
	const [user_state, setUserState] = useState<UserStateType>({ login: false, fetching: true });
	const all_chat_state = AllChatState.useContainer();
	const bottom_panel_state = BottomPanelState.useContainer();

	async function getLoginState(): Promise<boolean> {
		try {
			const user = unwrap(await API_FETCHER.userQuery.queryMe());
			if (user) {
				setLogin(user);
				return true;
			} else {
				setLogout();
				return false;
			}
		} catch (err) {
			toastErr(err);
			return false;
		}
	}

	function setLogin(data: LoginData): void {
		setUserState({
			login: true,
			id: data.id,
			user_name: data.user_name,
			email: data.email,
			energy: data.energy,
		});
		window.chat_socket.init(all_chat_state);
	}
	function setLogout(): void {
		bottom_panel_state.clearRoom();
		all_chat_state.reset();
		window.chat_socket.close();
		setUserState({ login: false, fetching: false });
	}
	return { user_state, setLogin, setLogout, getLoginState };
}

export const UserState = createContainer(useUserState);