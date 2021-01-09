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
import '../../css/variable.css?global';
import '../../css/layout.css?global';
import '../../css/global.css?global';

import { UserState } from '../global_state/user';
import { BottomPanelState } from '../global_state/bottom_panel';
import { SubscribedBoardsState } from '../global_state/subscribed_boards';
import { BoardCacheState } from '../global_state/board_cache';
import { AllChatState } from '../global_state/chat';
import { EditorPanelState } from '../global_state/editor_panel';
import { MainScrollState } from '../global_state/main_scroll';
import { BoardList } from '../board_list';
import { SignupPage } from '../signup_page';
import { UserPage } from '../profile/user_page';
import { PartySwitch } from '../party_switch';
import { GeneralBoard, PersonalBoard } from '../board_switch';
import { Header } from './header';
// import { LeftPanel } from '../left_panel';
import { BottomPanel } from '../bottom_panel';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { SearchPage } from '../search_page/search_page';
import { toastErr } from '../utils';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });

function App(): JSX.Element {
	function MainBody(): JSX.Element {
		let { setEmitter } = MainScrollState.useContainer();
		return <div className="mainBody" ref={ref => setEmitter(ref)}>
			<Switch>
				<Route exact path="/app/signup/:signup_token" render={props => (
					<SignupPage {...props} />
				)} />
				<Route exact path="/app" render={() => (
					<BoardList></BoardList>
				)} />
				<Route exact path="/app/search" render={props => (
					<SearchPage {...props}/>
				)} />
				<Route path="/app/party" render={() =>
					<PartySwitch />
				} />
				<Route path="/app/user/:profile_name" render={props =>
					<UserPage {...props} />
				} />
				<Route path="/app/user_board/:profile_name" render={props =>
					<PersonalBoard {...props} hide_sidebar />
				} />
				<Route path="/app/b/:board_name" render={props =>
					<GeneralBoard {...props} hide_sidebar />
				} />
				<Route path="*" render={() =>
					<Redirect to="/app" />
				} />
			</Switch>
		</div>;
	}
	function Content(): JSX.Element {
		const { user_state } = UserState.useContainer();
		const { load, unload } = SubscribedBoardsState.useContainer();
		React.useEffect(() => {
			(async () => {
				if (user_state.login) {
					console.log('載入追蹤看板');
					try {
						let result = await API_FETCHER.querySubcribedBoards();
						let boards = unwrap(result);
						load(boards);
					} catch (err) {
						toastErr(err);
					}
				} else {
					unload();
				}
			})();
		}, [load, unload, user_state.login]);

		return <Router>
			<Header></Header>
			<div className="other" >
				{/* <LeftPanel></LeftPanel> */}
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
				<SubscribedBoardsState.Provider>
					<BottomPanelState.Provider>
						<AllChatState.Provider>
							<EditorPanelState.Provider>
								<BoardCacheState.Provider>
									<Content />
								</BoardCacheState.Provider>
							</EditorPanelState.Provider>
						</AllChatState.Provider>
					</BottomPanelState.Provider>
				</SubscribedBoardsState.Provider>
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
