import * as React from "react";
import { UserState } from "./global_state";

function MainContent(): JSX.Element {
	const { user_state, set_login, set_logout } = UserState.useContainer();
	return (
		<div>
			<div>
				<h1>金剛、石墨，參見！</h1>
				<h1>{user_state.login ? user_state.user_id : "未登入"}</h1>
				{
					(() => {
						if (user_state.login) {
							return <button className="pure-button"
								onClick={() => set_logout()}>登出</button>;
						} else {
							return <button className="pure-button"
								onClick={() => set_login("金剛")}>登入</button>;
						}
					})()
				}
				<button className="pure-button">註冊</button>
			</div>
		</div>
	);
}

export { MainContent };