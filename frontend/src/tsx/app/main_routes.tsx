import React from 'react';
import {
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

import { BoardList } from '../board_list';
import { SignupPage } from '../signup_page';
import { ResetPassword } from '../reset_password';
import { KeepAliveUserPage } from '../profile/user_page';
import { MyPartyList } from '../party/my_party_list';
import { PartyDetail } from '../party/party_detail';
import { SignupInvitationPage } from '../signup_invitation_page';
import { GeneralBoard, PersonalBoard } from '../board_switch';
import { SearchPage } from '../search_page/search_page';
import { SettingPage } from '../setting_page';
import { SubscribeArticlePage } from '../subscribe_article_page';
import { PopArticlePage } from '../pop_article_page';
import { LawPage } from '../law_page';

export function MainRoutes(): JSX.Element {
	return <Routes>
		<Route path="/app/signup/:token" element={<SignupPage />} />
		<Route path="/app/reset_password/:token" element={<ResetPassword />} />
		<Route path="/app" element={<BoardList />} />
		<Route path="/app/board_list" element={<BoardList />} />
		<Route path="/app/search" element={<SearchPage />} />
		<Route path="/app/party" element={<MyPartyList />} />
		<Route path="/app/party/:party_name" element={<PartyDetail />} />
		<Route path="/app/signup_invite" element={<SignupInvitationPage />} />
		<Route path="/app/setting" element={<SettingPage />} />
		<Route path="/app/user/:profile_name" element={<KeepAliveUserPage />} />
		<Route path="/app/user_board/:profile_name" element={<PersonalBoard />} />
		<Route path="/app/b/:board_name/*" element={<GeneralBoard />} />
		<Route path="/app/subscribe_article" element={<SubscribeArticlePage />} />
		<Route path="/app/pop_article" element={<PopArticlePage />} />
		<Route path="/app/law/*" element={<LawPage />} />
		<Route path="*" element={<Navigate to="/app" />} />
	</Routes>;
}