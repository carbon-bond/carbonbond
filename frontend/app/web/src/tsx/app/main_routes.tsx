import React from 'react';
import {
	Routes,
	Route,
	Outlet,
	Navigate,
} from 'react-router-dom';

import { AllBoardList, HotBoardList, SubscribeBoardList } from '../board_list';
import { SignupPage } from '../signup_page';
import { ResetPassword } from '../reset_password';
import { KeepAliveUserPage } from '../profile/user_page';
import { MyPartyList } from '../party/my_party_list';
import { PartyDetail } from '../party/party_detail';
import { SignupInvitationPage } from '../signup_invitation_page';
import { KeepAliveBoardPage } from '../board';
import { SearchPage } from '../search_page/search_page';
import { SettingPage } from '../setting_page/setting_page';
import { SubscribeArticlePage } from '../subscribe_article_page';
import { PopularArticlePage } from '../pop_article_page';
import { LawPage } from '../law_page';
import { GraphPage } from '../board/graph_view';
import { ArticlePage, ArticleRedirect } from '../board/article_page';
import { ChangeEmail } from '../change_email';
import { VerifyTitle } from '../verify_title';

export function MainRoutes(): JSX.Element {
	return <Routes>
		<Route path="/app/signup/:token" element={<SignupPage />} />
		<Route path="/app/reset_password/:token" element={<ResetPassword />} />
		<Route path="/app/change_email/:token" element={<ChangeEmail />} />
		<Route path="/app/verify_title/:token" element={<VerifyTitle />} />
		<Route path="/app" element={<AllBoardList />} />
		<Route path="/app/all_board_list" element={<AllBoardList />} />
		<Route path="/app/hot_board_list" element={<HotBoardList />} />
		<Route path="/app/subscribe_board_list" element={<SubscribeBoardList />} />
		<Route path="/app/search" element={<SearchPage />} />
		<Route path="/app/party" element={<MyPartyList />} />
		<Route path="/app/party/:party_name" element={<PartyDetail />} />
		<Route path="/app/signup_invite" element={<SignupInvitationPage />} />
		<Route path="/app/setting" element={<SettingPage />} />
		<Route path="/app/user/:user_name" element={<KeepAliveUserPage />} />
		<Route path="/app/article/:article_id" element={<ArticleRedirect />} />
		<Route path="/app/b/:board_type/:board_name" element={<Outlet />}>
			<Route path="article/:article_id" element={<ArticlePage />} />
			<Route path="graph/:article_id" element={<GraphPage />} />
			<Route path="" element={<KeepAliveBoardPage />} />
		</Route>
		<Route path="/app/subscribe_article" element={<SubscribeArticlePage />} />
		<Route path="/app/pop_article" element={<PopularArticlePage />} />
		<Route path="/app/law/*" element={<LawPage />} />
		<Route path="*" element={<Navigate to="/app" />} />
	</Routes>;
}