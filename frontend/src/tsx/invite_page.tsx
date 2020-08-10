import * as React from 'react';
import '../css/invite_page.css';
import { UserState } from './global_state/user';
import { useInputValue } from './utils';
import { toast } from 'react-toastify';
import { matchErrAndShow, ajaxOperation } from '../ts/api';

function InvitePage(): JSX.Element {
	const { user_state, getLoginState } = UserState.useContainer();
	const email = useInputValue('').input_props;
	const invitation = useInputValue('').input_props;

	async function sendInvitation(): Promise<{}> {
		try {
			await ajaxOperation.InviteSignup({
				email: email.value,
				invitation_words: invitation.value
			});
			toast('已送出邀請信');
			await getLoginState();
		} catch (err) {
			matchErrAndShow(err);
		}
		return {};
	}

	if (user_state.login && user_state.invitation_credit > 0) {
		return <div styleName="invitePage">
			<div styleName="inviteForm">
				<div styleName="counter">您還有 {user_state.invitation_credit} 封邀請信</div>
				<input {...email} styleName="email" type="email" placeholder="受邀者信箱" autoFocus />
				<textarea {...invitation} styleName="invitation" placeholder="邀請詞（選填）" />
				<button onClick={ () => sendInvitation() }>寄出邀請信</button>
			</div>
		</div>;
	} else if (user_state.login && user_state.invitation_credit == 0) {
		return <div styleName="invitePage">
			<div styleName="inviteForm">
				您的邀請信已經用畢
			</div>
		</div>;
	} else {
		return <div styleName="invitePage">
			<div styleName="inviteForm">
				未登入者無法寄送邀請信
			</div>
		</div>;
	}
}

export {
	InvitePage
};