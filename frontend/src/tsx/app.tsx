import * as React from "react";
import * as ReactDOM from "react-dom";
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect,
} from "react-router-dom";

import "purecss/build/pure-min.css?global";
import "../css/normal.css";

import { LoginContext, Login } from "./types";
import { Component } from "./component";
import { RegisterPage } from "./register_page";

type LoginState = { login: true, user_id: string } | { login: false };

function App(): JSX.Element {
	let [login_state, setLoginState] = React.useState<LoginState>({ login: false });
	function setLoginUI(user_id: string): void {
		if (login_state.login) {
			throw "已登入的狀況下設置登入";
		} else {
			setLoginState({ login: true, user_id });
		}
	}
	function unsetLoginUI(): void {
		if (login_state.login) {
			setLoginState({ login: false });
		} else {
			throw "未登入的狀況下還想登出";
		}
	}
	function renderContent(): JSX.Element {
		return <>
			{/* HEADER */}
			<Router>
				<Switch>
					<Route exact path="/app" render={() => (
						<Component></Component>
					)}/>
					<Route path="/app/register/:invite_code" render={props =>
						<RegisterPage {...props}/>
					}/>
					<Redirect to="/app"/>
				</Switch>
			</Router>
		</>;
	}
	let context: LoginContext = {
		login: false,
		setLogin: setLoginUI
	};
	if (login_state.login) {
		context = {
			...login_state,
			unsetLogin: unsetLoginUI
		};
	}
	return (
		<Login.Provider value={context}>
			{renderContent()}
		</Login.Provider>
	);
}

ReactDOM.render(<App />, document.getElementById("root"));
