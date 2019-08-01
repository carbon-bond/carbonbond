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
import '../css/global.css?global';

import { UserState, BottomPanelState, AllChatState, EditorPanelState, ScrollState } from './global_state';
import { MainContent } from './main_content';
import { RegisterPage } from './register_page';
import { PartySwitch } from './party_switch';
import { BoardSwitch } from './board_switch';
import { Header } from './header';
import { LeftPanel } from './left_panel';
import { BottomPanel } from './bottom_panel';
import { ArticlePage } from './board_switch/article_page';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });

function App(): JSX.Element {

	function Content(): JSX.Element {
		let { setEmitter } = ScrollState.useContainer();
		let ref = React.useRef(null);
		setEmitter(ref);
		return <Router>
			<Header></Header>
			<div className="other">
				<LeftPanel></LeftPanel>
				<div className='mainBody' ref={ref}>
					<Switch>
						<Route path="/app/register/:invite_code" render={props =>
							<RegisterPage {...props} />
						} />
						<Route path="/app/party" render={() =>
							<PartySwitch />
						} />
						<Route path="/app/a/:article_id" render={props =>
							<ArticlePage {...props} />
						} />
						<Route path="*" render={() =>
							<div className='forumBody'>
								<Switch>
									<Route exact path="/app" render={() => (
										<MainContent></MainContent>
									)} />
									<Route path="/app/b/:board_name" render={() =>
										<BoardSwitch />
									} />
									<Redirect to="/app" />
								</Switch>
							</div>
						} />
					</Switch>
				</div>
				<BottomPanel></BottomPanel>
			</div>
		</Router>;
	}

	return (
		<div className="app">
			<UserState.Provider>
				<BottomPanelState.Provider>
					<AllChatState.Provider>
						<EditorPanelState.Provider>
							<ScrollState.Provider>
								<Content/>
							</ScrollState.Provider>
						</EditorPanelState.Provider>
					</AllChatState.Provider>
				</BottomPanelState.Provider>
			</UserState.Provider>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById('root'));
