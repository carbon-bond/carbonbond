import * as React from 'react';
import { toast } from 'react-toastify';
import style from '../css/setting_page.module.css';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { UserState } from './global_state/user';
import { toastErr } from './utils';

export function SettingPage(): JSX.Element {
	const { user_state } = UserState.useContainer();
	async function reset_password_request(): Promise<void> {
		try {
			if (user_state.login) {
				unwrap(await API_FETCHER.sendResetPasswordEmail(user_state.email));
				toast(`已寄出重置碼到 ${user_state.email} ，請至信箱查收`);
			}
		} catch (err) {
			toastErr(err);
		}
		return;
	}
	return <div className={style.settingPage}>
		<div className={style.settings}>
			<span>重置密碼：</span>
			<button onClick={reset_password_request}> 寄發重置碼到信箱 </button>
		</div>
	</div>;
}