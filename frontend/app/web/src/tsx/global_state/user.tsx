import { API_FETCHER, unwrap } from 'carbonbond-api/api_utils';
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
	is_robot: boolean,
	email: string,
	sentence: string,
	energy: number,
	titles: string[],
};

interface LoginData {
	id: number,
	user_name: string,
	is_robot: boolean,
	sentence: string,
	email: string,
	energy: number,
	titles: string | null
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
			sentence: data.sentence,
			id: data.id,
			user_name: data.user_name,
			is_robot: data.is_robot,
			email: data.email,
			energy: data.energy,
			titles: data.titles ? data.titles.split(',') : []
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