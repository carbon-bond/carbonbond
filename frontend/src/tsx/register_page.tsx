import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { UserState } from './global_state';

type Props = RouteComponentProps<{ invite_code?: string }>;

function fetchEmail(invite_code: string): Promise<string> {
	return fetch('/api/invite-code', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ invite_code })
	}).then(res => {
		if (res.ok) {
			return res.json();
		} else {
			throw `網路錯誤 ${res.status}`;
		}
	}).then(res_obj => {
		if (typeof res_obj['email'] == 'string') {
			return res_obj['email'];
		} else {
			throw '找不到 email';
		}
	});
}

export function RegisterPage(props: Props): JSX.Element {
	let [_email, setEmail] = React.useState('');
	let [fetching, setFetching] = React.useState(true);
	let { user_state } = UserState.useContainer();

	let getInviteCode = React.useCallback(() => {
		let code = props.match.params.invite_code;
		if (typeof code == 'string') {
			return code;
		} else {
			throw '找不到邀請碼';
		}
	}, [props.match.params.invite_code]);

	React.useEffect(() => {
		let invite_code = getInviteCode();
		fetchEmail(invite_code).then(email => {
			setEmail(email);
			setFetching(false);
		}).catch(err => console.log(err));
	}, [getInviteCode]);

	React.useEffect(() => {
		if (user_state.login) {
			// 跳轉回首頁
			props.history.push('/app');
		}
	}, [user_state.login]);

	if (fetching) {
		return <div> 載入頁 </div>;
	} else {
		return <div> 註冊頁 </div>;
	}
}