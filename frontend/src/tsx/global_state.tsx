import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import * as api from './api';

type UserState = { login: false } | { login: true, user_id: string };

function useUserState(): { user_state: UserState, set_login: Function, set_logout: Function } {
	let [user_state, setLogin] = useState<UserState>({ login: false });

	async function get_login_state(): Promise<{}> {
		const data = await api.me_request();
		if (data.me.id != null) {
			setLogin({ login: true, user_id: data.me.id });
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
		setLogin({ login: false });
	}
	return { user_state, set_login, set_logout };
}

export const UserState = createContainer(useUserState);