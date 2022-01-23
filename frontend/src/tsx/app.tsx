import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';
import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import 'normalize.css';
import '../css/variable.css';
import '../css/layout.css';
import '../css/global.css';

import { UserState } from './global_state/user';
import { BottomPanelState } from './global_state/bottom_panel';
import { SubscribedBoardsState } from './global_state/subscribed_boards';
import { DraftState } from './global_state/draft';
import { BoardCacheState } from './global_state/board_cache';
import { AllChatState } from './global_state/chat';
import { EditorPanelState } from './global_state/editor_panel';
import { MainScrollState } from './global_state/main_scroll';
import { BoardList } from './board_list';
import { SignupPage } from './signup_page';
import { SettingPage } from './setting_page';
import { PopArticlePage } from './pop_article_page';
import { SubscribeArticlePage } from './subscribe_article_page';
import { ResetPassword } from './reset_password';
import { UserPage } from './profile/user_page';
import { PartySwitch } from './party_switch';
import { SignupInvitationPage } from './signup_invitation_page';
import { BoardHeader, GeneralBoard, PersonalBoard } from './board_switch';
import { Header } from './header';
import { LeftPanel } from './left_panel';
import { BottomPanel } from './bottom_panel';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { SearchPage } from './search_page/search_page';
import { toastErr } from './utils';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });

function App(): JSX.Element {
	function MainBody(): JSX.Element {
		let { setEmitter } = MainScrollState.useContainer();
		return <div className="mainBody" ref={ref => setEmitter(ref)}>
			<Switch>
				<Route exact path="/app/signup/:token" render={props => (
					<SignupPage {...props} />
				)} />
				<Route exact path="/app/reset_password/:token" render={props => (
					<ResetPassword {...props} />
				)} />
				<Route exact path="/app" render={() => (
					<BoardList></BoardList>
				)} />
				<Route exact path="/app/board_list" render={() => (
					<BoardList></BoardList>
				)} />
				<Route exact path="/app/search" render={props => (
					<SearchPage {...props} />
				)} />
				<Route path="/app/party" render={() =>
					<PartySwitch />
				} />
				<Route path="/app/signup_invite" render={() =>
					<SignupInvitationPage />
				} />
				<Route path="/app/setting" render={() =>
					<SettingPage />
				} />
				<Route path="/app/user/:profile_name" render={props =>
					<UserPage {...props} />
				} />
				<Route path="/app/user_board/:profile_name" render={props =>
					<PersonalBoard {...props} render_header={
						(b, url, cnt) => <BoardHeader url={url} board={b} subscribe_count={cnt} />
					} />
				} />
				<Route path="/app/b/:board_name" render={props =>
					<GeneralBoard {...props} render_header={
						(b, url, cnt) => <BoardHeader url={url} board={b} subscribe_count={cnt} />
					} />
				} />
				<Route path="/app/subscribe_article" render={() =>
					<SubscribeArticlePage />
				} />
				<Route path="/app/pop_article" render={() =>
					<PopArticlePage />
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
		const all_chat_state = AllChatState.useContainer();
		React.useEffect(() => {
			(async () => {
				if (user_state.login) {
					console.log('載入訂閱看板');
					try {
						let result = await API_FETCHER.userQuery.querySubcribedBoards();
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
		React.useEffect(() => {
			window.chat_socket.set_all_chat(all_chat_state);
		}, [all_chat_state]);

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
			<ConfigState.Provider>
				<UserState.Provider>
					<DraftState.Provider>
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
					</DraftState.Provider>
				</UserState.Provider>
			</ConfigState.Provider>
		</div>
	);
}

declare global {
    interface Window { chat_socket: ChatSocket; }
}

import { ChatSocket } from '../ts/chat_socket';
import { ConfigState } from './global_state/config';

window.chat_socket = new ChatSocket();

ReactDOM.render(<App />, document.getElementById('root'));
