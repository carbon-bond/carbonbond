import * as React from 'react';
import { produce } from 'immer';

import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { UserState } from './global_state/user';
import { SignupInvitation } from '../ts/api/api_trait';

import { toastErr } from './utils';

import '../css/signup_invitation_page.css';

async function fetchSignupInvitationList(user_id: number): Promise<SignupInvitation[]> {
	console.log('fetcSignupInvitationList');
	let invitation_list = unwrap_or(await API_FETCHER.querySignupInvitationList(user_id), []);
	console.log(invitation_list);
	return invitation_list;
}
async function activateInvitation(invitation: SignupInvitation): Promise<string> {
	try {
		let code = unwrap_or(await API_FETCHER.activateSignupInvitation(invitation.id), '');
		navigator.clipboard.writeText('http://localhost:8080/app/signup_page/' + code);
		return code;
	} catch (err) {
		toastErr(err);
	}
	return '';
}

async function deactivateInvitation(invitation: SignupInvitation): Promise<{}> {
	try {
		await API_FETCHER.deactivateSignupInvitation(invitation.id);
	} catch (err) {
		toastErr(err);
	}
	return {};
}

async function getLink(invitation: SignupInvitation, i: number, invitations: SignupInvitation[], setInvitations: Function): Promise<void> {
	let code = (await activateInvitation(invitation));
	if (code != '') {
		let new_invitations = produce(invitations, invitations => {
			invitations[i].code = code;
		});
		setInvitations(new_invitations);
	}
}

async function delLink(invitation: SignupInvitation, i: number, invitations: SignupInvitation[], setInvitations: Function): Promise<void> {
	await deactivateInvitation(invitation);
	let new_invitations = produce(invitations, invitations => {
		invitations[i].code = '';
	});
	setInvitations(new_invitations);
}

function InviteList(): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [invitations, setInvitations] = React.useState<SignupInvitation[]>([]);

	console.log('AA');
	console.log(user_state);
	React.useEffect(() => {
		if (user_state.login) {
			console.log(user_state.id);
			fetchSignupInvitationList(user_state.id).then(tree => {
				console.log('QQ');
				console.log(tree);
				setInvitations(tree);
			}).catch(err => toastErr(err));
		}
	}, [user_state]);

	return <>
		{
			invitations.map((invitation, i) => (
				<div styleName="signupInvitationWrapper" key={`${invitation.id}`}>
					<div styleName="description">#{invitation.id}</div>
					<div styleName="description">描述：{invitation.description}</div>
					<button onClick={() => getLink(invitation, i, invitations, setInvitations)}>產生並複製邀請連結</button>
					<button onClick={() => delLink(invitation, i, invitations, setInvitations)}>關閉邀請連結</button>
					<div styleName="description">邀請連結：{(invitation.code && invitation.code !== '') ? `http://localhost:8080/app/signup_page/${invitation.code}` : '未啟用'}</div>
					<div styleName="description">使用狀況：{invitation.to_user ? '已使用' : '未使用'}</div>
				</div>
			))
		}
	</>;
}

export function SignupInvitationPage(): JSX.Element {
	return <>
		<h1>我的邀請碼</h1>
		<InviteList />
	</>;
}