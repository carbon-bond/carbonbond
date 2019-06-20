import * as React from "react";
import * as ReactDOM from "react-dom";
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect,
} from "react-router-dom";

import "normalize.css?global";
import "../css/layout.css?global";

import { LoginContext, Login } from "./types";
import { MainContent } from "./main_content";
import { RegisterPage } from "./register_page";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

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
			<Header></Header>
			<div className="other">
				<Router>
					<Switch>
						<Route exact path="/app" render={() => (
							<>
								<Sidebar></Sidebar>
								<MainContent></MainContent>
							</>
						)} />
						<Route path="/app/register/:invite_code" render={props =>
							<RegisterPage {...props}/>
						}/>
						<Redirect to="/app"/>
					</Switch>
				</Router>
			</div>
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
		<div className="app">
			<Login.Provider value={context}>
				{renderContent()}
			</Login.Provider>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById("root"));
