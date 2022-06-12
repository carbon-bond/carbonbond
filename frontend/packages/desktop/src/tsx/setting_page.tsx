import * as React from 'react';
import { toast } from 'react-toastify';
import style from '../css/setting_page.module.css';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { UserState } from './global_state/user';
import { toastErr } from './utils';
import { LocationState, SimpleLocation } from './global_state/location';
import { useForm } from 'react-hook-form';
import { InvalidMessage } from './components/invalid_message';
import { EMAIL_REGEX } from '../ts/regex_util';

function ChangePassword(): JSX.Element {
	const {
		register,
		handleSubmit,
		errors
	} = useForm({ mode: 'onSubmit' });

	function onSubmit(data: { new_email: string, password: string }): void {
		API_FETCHER.userQuery.sendChangeEmailEmail(data.new_email, data.password)
		.then(res => {
			unwrap(res);
			toast(`已寄出更換信箱信到 ${data.new_email}`);
		})
		.catch(err => toastErr(err));
	}

	return <div className={style.setting}>
		<div className={style.name}>更換電子信箱</div>
		<form onSubmit={handleSubmit(onSubmit)}>
			<input type="text" placeholder="新電子郵件" name="new_email" ref={register({ pattern: EMAIL_REGEX })} />
			{errors.new_email && <InvalidMessage msg={errors.new_email.message} />}
			<input type="password" placeholder="碳鍵密碼" name="password" ref={register()} />
			{errors.password && <InvalidMessage msg={errors.password.message} />}
			<div>
				<button> 寄發確認信到新信箱 </button>
			</div>
		</form>
	</div>;
}

export function SettingPage(): JSX.Element {
	const { user_state } = UserState.useContainer();
	const { setCurrentLocation } = LocationState.useContainer();
	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('設定'));
	}, [setCurrentLocation]);


	async function reset_password_request(): Promise<void> {
		try {
			if (user_state.login) {
				unwrap(await API_FETCHER.userQuery.sendResetPasswordEmail(user_state.email));
				toast(`已寄出重置碼到 ${user_state.email} ，請至信箱查收`);
			}
		} catch (err) {
			toastErr(err);
		}
		return;
	}
	return <div className={style.settingPage}>
		<div className={style.settings}>
			<div className={style.setting}>
				<div className={style.name}>重置密碼</div>
				<button onClick={reset_password_request}> 寄發重置碼到信箱 </button>
			</div>
			<hr />
			<ChangePassword />
		</div>
	</div>;
}