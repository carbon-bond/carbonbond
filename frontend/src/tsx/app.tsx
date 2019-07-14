import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';
import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css?global';
import 'normalize.css?global';
import '../css/layout.css?global';

import { UserState, BottomPanelState, AllChatState } from './global_state';
import { MainContent } from './main_content';
import { RegisterPage } from './register_page';
import { PartyCenter } from './party_center';
import { Header } from './header';
import { LeftPanel } from './left_panel';
import { BottomPanel } from './bottom_panel';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });

function App(): JSX.Element {

	function renderContent(): JSX.Element {
		return <Router>
			<Header></Header>
			<div className="other">
				<LeftPanel></LeftPanel>
				<Switch>
					<Route exact path="/app" render={() => (
						<MainContent></MainContent>
					)} />
					<Route path="/app/register/:invite_code" render={props =>
						<RegisterPage {...props} />
					} />
					<Route path="/app/party" render={() =>
						<PartyCenter />
					} />
					<Redirect to="/app" />
				</Switch>
				<BottomPanel></BottomPanel>
			</div>
		</Router>;
	}

	return (
		<div className="app">
			<UserState.Provider>
				<BottomPanelState.Provider>
					<AllChatState.Provider>
						{renderContent()}
					</AllChatState.Provider>
				</BottomPanelState.Provider>
			</UserState.Provider>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById('root'));
