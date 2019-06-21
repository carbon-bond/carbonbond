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

import { UserState } from "./global_state";
import { MainContent } from "./main_content";
import { RegisterPage } from "./register_page";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

function App(): JSX.Element {

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
	return (
		<div className="app">
			<UserState.Provider>
				{renderContent()}
			</UserState.Provider>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById("root"));
