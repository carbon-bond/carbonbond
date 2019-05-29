import * as React from "react";
import * as ReactDOM from "react-dom";
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect,
} from "react-router-dom";

import "purecss/build/pure-min.css?global";
// import "purecss/build/pure-min.css";
import "../css/normal.css";

import { LoginState, LoginContext } from "./types";
import { Component } from "./component";
import { RegisterPage } from "./register_page";

class App extends React.Component<{}, { login_state: LoginState }> {
	constructor(props: {}) {
		super(props);
		this.state = {
			login_state: { login: false }
		};
	}
	setLoginState(user_id: string) {
		if(this.state.login_state.login) {
			throw "已登入的狀況下設置登入";
		} else {
			this.setState({ login_state: { login: true, user_id } });
		}
	}
	unsetLoginState() {
		if(this.state.login_state.login) {
			this.setState({ login_state: { login: false } });
		} else {
			throw "未登入的狀況下還想登出";
		}
	}
	renderContent() {
		return <div>
			{/* HEADER */}
			<Router>
				<Switch>
					<Route exact path="/app" render={() => (
						<div>
							<h1>金剛、石墨，參見！</h1>
							<h2>outer h2</h2>
							<div styleName="green">
								<h2>h2</h2>
								<h3>h3</h3>
							</div>
							<button className="pure-button">global</button>
							{/* <button styleName="pure-button">local</button> */}
							<div className="red">red global</div>
							<div styleName="red">red local</div>
							<Component
								setLoginState={this.setLoginState.bind(this)}
								unsetLoginState={this.unsetLoginState.bind(this)}
							></Component>
						</div>
					)}/>
					<Route path="/app/register/:invite_code"
						component={RegisterPage}/>
					<Redirect to="/app"/>
				</Switch>
			</Router>
		</div>;
	}
	render() {
		return (
			<LoginContext.Provider value={this.state.login_state}>
				{this.renderContent()}
			</LoginContext.Provider>
		);
	}
}

ReactDOM.render(<App />, document.getElementById("root"));
