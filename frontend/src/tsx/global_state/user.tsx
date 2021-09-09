import { API_FETCHER, unwrap } from '../../ts/api/api';
import * as React from 'react';
import { createContainer } from 'unstated-next';
import { toastErr } from '../utils';
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

function useUserState(): { user_state: UserStateType, setLogin: Function, setLogout: Function, getLoginState: Function } {
	const [user_state, setUserState] = useState<UserStateType>({ login: false, fetching: true });

	async function getLoginState(): Promise<void> {
		try {
			const user = unwrap(await API_FETCHER.userQuery.queryMe());
			if (user) {
				setUserState({
					login: true,
					user_name: user.user_name,
					email: user.email,
					id: user.id,
					energy: user.energy,
				});
			} else {
				setUserState({ login: false, fetching: false });
			}
		} catch (err) {
			toastErr(err);
		}
		return;
	}

	React.useEffect(() => {
		getLoginState();
	}, []);

	function setLogin(data: LoginData): void {
		setUserState({
			login: true,
			id: data.id,
			user_name: data.user_name,
			email: data.email,
			energy: data.energy,
		});
	}
	function setLogout(): void {
		setUserState({ login: false, fetching: false });
	}
	return { user_state, setLogin, setLogout, getLoginState };
}

export const UserState = createContainer(useUserState);