import * as React from 'react';
import '../css/invite_page.css';
import { UserState } from './global_state';

function InvitePage(): JSX.Element {
	const { user_state } = UserState.useContainer();
	if (user_state.login) {
		return <div styleName="invitePage">
			{/* TODO: 顯示目前還有幾封邀請信，若沒有邀請信了，不顯示表單 */}
			<div styleName="inviteForm">
				<div styleName="counter">您還有 {user_state.invitation_credit} 封邀請信</div>
				<input styleName="email" type="email" placeholder="受邀者信箱" autoFocus />
				<textarea styleName="invitation" placeholder="邀請詞（選填）" />
				<button>寄出邀請信</button>
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