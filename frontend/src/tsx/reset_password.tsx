import * as React from 'react';
import { toast } from 'react-toastify';
import { RouteComponentProps } from 'react-router';
import { toastErr, useInputValue } from './utils';
import style from '../css/reset_password.module.css';
import { API_FETCHER } from '../ts/api/api';
import type { Error } from '../ts/api/api_trait';
import { UserState } from './global_state/user';

type Props = RouteComponentProps<{ token: string }>;

export function ResetPassword(props: Props): JSX.Element {
	let password = useInputValue('').input_props;
	let repeated_password = useInputValue('').input_props;
	let [user_name, setUserName] = React.useState<null | string>(null);
	let [err, setErr] = React.useState<Error | null>(null);
	let { getLoginState } = UserState.useContainer();
	let token = props.match.params.token;

	async function reset_password_request(password: string, repeated_password: string): Promise<void> {
		try {
			if (repeated_password != password) {
				throw '兩次密碼輸入不同';
			}
			await API_FETCHER.resetPasswordByToken(password, token);
			props.history.push('/app/');
			getLoginState();
			toast('重設密碼成功，請再次登入');
		} catch (err) {
			toastErr(err);
		}
	}

	React.useEffect(() => {
		API_FETCHER.queryUserNameByResetPasswordToken(token).then(res => {
			try {
				if ('Ok' in res) {
					setUserName(res.Ok);
				} else {
					setErr(res.Err);
				}
			} catch (err) {
				toastErr(err);
			}
		});
	}, [token]);

	if (user_name) {
		return <div className={style.signupPage}>
			<div className={style.signupForm}>
				<div className={style.counter}> {user_name} ，歡迎歸來！　</div>
				<input className={style.password} type="password" placeholder="新密碼" {...password} autoFocus />
				<input className={style.password} type="password" placeholder="確認密碼" {...repeated_password} autoFocus />
				<button onClick={() => reset_password_request(password.value, repeated_password.value)}>
					重置密碼
				</button>
			</div>
		</div>;
	} else if (err) {
		return <div className={style.signupPage}>
			<div className={style.signupForm}>
				<div className={style.counter}>重置碼已過期或不存在！</div>
			</div>
		</div>;
	} else {
		return <></>;
	}
}