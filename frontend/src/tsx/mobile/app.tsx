import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import { AliveScope } from 'react-activation';

import 'react-toastify/dist/ReactToastify.css';
import 'normalize.css';
import '../../css/variable.css';
import '../../css/layout.css';
import '../../css/global.css';

import { UserState } from '../global_state/user';
import { BottomPanelState } from '../global_state/bottom_panel';
import { SubscribedBoardsState } from '../global_state/subscribed_boards';
import { BoardCacheState } from '../global_state/board_cache';
import { AllChatState } from '../global_state/chat';
import { EditorPanelState } from '../global_state/editor_panel';
import { BoardList } from '../board_list';
import { SignupPage } from '../signup_page';
import { ResetPassword } from '../reset_password';
import { KeepAliveUserPage } from '../profile/user_page';
import { MyPartyList } from '../party/my_party_list';
import { PartyDetail } from '../party/party_detail';
import { SignupInvitationPage } from '../signup_invitation_page';
import { GeneralBoard, PersonalBoard } from '../board_switch';
import { Header } from './header';
import { Footer, FooterOption, FooterState } from './footer';
// import { LeftPanel } from '../left_panel';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { SearchPage } from '../search_page/search_page';
import { toastErr } from '../utils';
import { NotificationModal } from './notification';
import { DraftState } from '../global_state/draft';
import { ConfigState } from '../global_state/config';

// 配置全域提醒
toast.configure({ position: 'bottom-right' });

function App(): JSX.Element {

	function MainBody(): JSX.Element {
		let { footer_option } = FooterState.useContainer();
		let show_main_scroll = footer_option == FooterOption.Home;

		return <div className="mainBody"
			style={{ overflowY: show_main_scroll ? 'auto' : 'hidden' }} >
			{
				footer_option == FooterOption.Notification ?
					<NotificationModal/> : null
			}

			<Routes>
				<Route path="/app/signup/:token" element={<SignupPage />} />
				<Route path="/app/reset_password/:token" element={<ResetPassword />} />
				<Route path="/app" element={<BoardList />} />
				<Route path="/app/board_list" element={<BoardList />} />
				<Route path="/app/search" element={<SearchPage />} />
				<Route path="/app/party" element={<MyPartyList />} />
				<Route path="/app/party/:party_name" element={<PartyDetail /> } />
				<Route path="/app/signup_invite" element={<SignupInvitationPage />} />
				<Route path="/app/user/:profile_name" element={ <KeepAliveUserPage />} />
				<Route path="/app/user_board/:profile_name" element={ <PersonalBoard /> } />
				<Route path="/app/b/:board_name/*" element={ <GeneralBoard /> } />
				<Route path="*" element={<Navigate to="/app" />} />
			</Routes>
		</div>;
	}
	function Content(): JSX.Element {
		const { user_state } = UserState.useContainer();
		const { load, unload } = SubscribedBoardsState.useContainer();
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

		return <Router>
			<Header/>
			<FooterState.Provider>
				<div className="other" >
					<MainBody />
				</div>
				<Footer/>
			</FooterState.Provider>
		</Router>;
	}

	return (
		<div className="appMobile">
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
    interface Window { chat_socket: ChatSocket, is_mobile: boolean; }
}

import { ChatSocket } from '../../ts/chat_socket';
window.chat_socket = new ChatSocket();
window.is_mobile = true;

ReactDOM.render(<AliveScope><App /></AliveScope>, document.getElementById('root'));
