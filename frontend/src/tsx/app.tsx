import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import KeepAlive, { AliveScope } from 'react-activation';

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
import { BoardList } from './board_list';
import { SignupPage } from './signup_page';
import { SettingPage } from './setting_page';
import { PopArticlePage } from './pop_article_page';
import { SubscribeArticlePage } from './subscribe_article_page';
import { ResetPassword } from './reset_password';
import { UserPage } from './profile/user_page';
import { MyPartyList } from './party/my_party_list';
import { PartyDetail } from './party/party_detail';

import { SignupInvitationPage } from './signup_invitation_page';
import { BoardHeader, GeneralBoard, PersonalBoard } from './board_switch';
import { Header } from './header';
import { LeftPanel } from './left_panel';
import { BottomPanel } from './bottom_panel';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { SearchPage } from './search_page/search_page';
import { LawPage } from './law_page';
import { toastErr } from './utils';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });


function App(): JSX.Element {
	function MainBody(): JSX.Element {
		return <div className="mainBody">
			<Routes>
				<Route path="/app/signup/:token" element={<SignupPage />} />
				<Route path="/app/reset_password/:token" element={<ResetPassword />} />
				<Route path="/app" element={<BoardList />} />
				<Route path="/app/board_list" element={<BoardList />} />
				<Route path="/app/search" element={<SearchPage />} />
				<Route path="/app/party" element={<MyPartyList />} />
				<Route path="/app/party/:party_name" element={<PartyDetail /> } />
				<Route path="/app/signup_invite" element={<SignupInvitationPage />} />
				<Route path="/app/setting" element={<SettingPage />} />
				<Route path="/app/user/:profile_name" element={ <KeepAlive children={<UserPage />} /> } />
				<Route path="/app/user_board/:profile_name" element={
					<PersonalBoard render_header={
						(b, url, cnt) => <BoardHeader url={url} board={b} subscribe_count={cnt} />
					} />
				} />
				<Route path="/app/b/:board_name/*" element={
					<GeneralBoard render_header={
						(b, url, cnt) => <BoardHeader url={url} board={b} subscribe_count={cnt} />
					} />
				} />
				<Route path="/app/subscribe_article" element={<SubscribeArticlePage />} />
				<Route path="/app/pop_article" element={<PopArticlePage />} />
				<Route path="/app/law/*" element={<LawPage />} />
				<Route path="*" element={<Navigate to="/app" />} />
			</Routes>
		</div>;
	}
	function Content(): JSX.Element {
		const { user_state, getLoginState } = UserState.useContainer();
		const { load, unload } = SubscribedBoardsState.useContainer();
		const all_chat_state = AllChatState.useContainer();
		React.useEffect(() => {
			getLoginState();
			// eslint-disable-next-line
		}, []);
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
			<Header />
			<div className="other">
				<LeftPanel></LeftPanel>
				<MainBody />
				<BottomPanel></BottomPanel>
			</div>
		</Router>;
	}

	return (
		<div className="app">
			<ConfigState.Provider>
				<AllChatState.Provider>
					<BottomPanelState.Provider>
						<UserState.Provider>
							<DraftState.Provider>
								<SubscribedBoardsState.Provider>
									<EditorPanelState.Provider>
										<BoardCacheState.Provider>
											<Content />
										</BoardCacheState.Provider>
									</EditorPanelState.Provider>
								</SubscribedBoardsState.Provider>
							</DraftState.Provider>
						</UserState.Provider>
					</BottomPanelState.Provider>
				</AllChatState.Provider>
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

ReactDOM.render(<AliveScope><App /></AliveScope>, document.getElementById('root'));
