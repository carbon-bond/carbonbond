import * as React from 'react';
import '../css/invite_page.css';

function InvitePage(): JSX.Element {
	return <div styleName="invitePage">
		{/* TODO: 顯示目前還有幾封邀請信，若沒有邀請信了，不顯示表單 */}
		<div styleName="inviteForm">
			<div styleName="counter">您還有 X 封邀請信</div>
			<input styleName="email" type="text" placeholder="受邀者信箱" autoFocus />
			<textarea styleName="invitation" placeholder="邀請詞（選填）" />
			<button>寄出邀請信</button>
		</div>
	</div>;
}

export {
	InvitePage
};