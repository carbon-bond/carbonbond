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
import '../css/variable.css?global';
import '../css/layout.css?global';
import '../css/global.css?global';

import { UserState, BottomPanelState, AllChatState, EditorPanelState, MainScrollState } from './global_state';
import { BoardList } from './board_list';
import { SignupPage } from './signup_page';
import { InvitePage } from './invite_page';
import { UserPage } from './profile/user_page';
import { PartySwitch } from './party_switch';
import { BoardSwitch } from './board_switch';
import { Header } from './header';
import { LeftPanel } from './left_panel';
import { BottomPanel } from './bottom_panel';
import { ArticlePage } from './board_switch/article_page';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });

function App(): JSX.Element {
	function MainBody(): JSX.Element {
		let { setEmitter } = MainScrollState.useContainer();
		return <div className="mainBody" ref={ref => setEmitter(ref)}>
			<Switch>
				<Route exact path="/app" render={() => (
					<BoardList></BoardList>
				)} />
				<Route path="/app/register/:invite_code" render={props =>
					<SignupPage {...props} />
				} />
				<Route path="/app/invite" render={() =>
					<InvitePage />
				} />
				<Route path="/app/party" render={() =>
					<PartySwitch />
				} />
				<Route path="/app/user/:user_name" render={props =>
					<UserPage {...props}/>
				} />
				<Route path="/app/a/:article_id" render={props =>
					<ArticlePage {...props} />
				} />
				<Route path="/app/b/:board_name" render={() =>
					<BoardSwitch />
				} />
				<Route path="*" render={() =>
					<Redirect to="/app" />
				} />
			</Switch>
		</div>;
	}
	function Content(): JSX.Element {
		return <Router>
			<Header></Header>
			<div className="other">
				<LeftPanel></LeftPanel>
				<MainScrollState.Provider>
					<MainBody />
				</MainScrollState.Provider>
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
							<Content />
						</EditorPanelState.Provider>
					</AllChatState.Provider>
				</BottomPanelState.Provider>
			</UserState.Provider>
		</div>
	);
}

// declare global {
//     interface Window { chat_socket: ChatSocket; }
// }

// import { ChatSocket } from '../ts/chat_socket';
// window.chat_socket = new ChatSocket(1);

ReactDOM.render(<App />, document.getElementById('root'));
