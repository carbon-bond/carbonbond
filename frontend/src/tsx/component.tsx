import * as React from "react";

import { LoginContext } from "./types"

function Component(props: { setLoginState: (id: string) => void, unsetLoginState: () => void }) {
	return <LoginContext.Consumer>
		{
			login_state => <div>
				<h1>金剛、石墨，參見！</h1>
				<h1>{login_state.login ? login_state.user_id : "未登入"}</h1>
				{
					(() => {
						if(login_state.login) {
							return <button className="pure-button"
								onClick={props.unsetLoginState}>登出</button>
						} else {
							return <button className="pure-button"
								onClick={() => props.setLoginState("測試帳號")}>登入</button>
						}
					})()
				}
				<button className="pure-button">註冊</button>
			</div>
		}
	</LoginContext.Consumer>;
}

export { Component };