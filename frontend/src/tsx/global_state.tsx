import * as React from "react";
const { useState } = React;
import { createContainer } from "unstated-next";

type UserState = { login: false } | { login: true, user_id: string };

function useUserState(): { user_state: UserState, set_login: Function, set_logout: Function } {
	let [user_state, setLogin] = useState<UserState>({ login: false });
	function set_login(user_id: string): void {
		setLogin({ login: true, user_id: user_id });
	}
	function set_logout(): void {
		setLogin({ login: false });
	}
	return { user_state, set_login, set_logout };
}

export const UserState = createContainer(useUserState);