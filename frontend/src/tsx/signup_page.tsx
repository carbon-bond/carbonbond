import * as React from 'react';
import { toast } from 'react-toastify';
import { RouteComponentProps } from 'react-router';
import { toastErr, useInputValue } from './utils';
import style from '../css/signup_page.module.css';
import { API_FETCHER } from '../ts/api/api';
import type { Error } from '../ts/api/api_trait';
import { UserState } from './global_state/user';

type Props = RouteComponentProps<{ token: string }>;

export function SignupPage(props: Props): JSX.Element {
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	let repeated_password = useInputValue('').input_props;
	let [email, setEmail] = React.useState<null | string>(null);
	let [err, setErr] = React.useState<Error | null>(null);
	let token = props.match.params.token;
	let { getLoginState } = UserState.useContainer();

	async function signup_request(name: string, password: string, repeated_password: string): Promise<void> {
		try {
			if (repeated_password != password) {
				throw '兩次密碼輸入不同';
			}
			await API_FETCHER.signup(name, password, token);
			props.history.push('/app/');
			getLoginState();
			toast('註冊成功');
		} catch (err) {
			toastErr(err);
		}
	}

	React.useEffect(() => {
		API_FETCHER.queryEmailByToken(token).then(res => {
			try {
				if ('Ok' in res) {
					setEmail(res.Ok);
				} else {
					setErr(res.Err);
				}
			} catch (err) {
				toastErr(err);
			}
		});
	}, [token]);

	if (email) {
		return <div className={style.signupPage}>
			<div className={style.signupForm}>
				<div className={style.counter}>你的email是：　{email}　</div>
				<input className={style.username} type="text" placeholder="使用者名稱" {...name} autoFocus />
				<input className={style.password} type="password" placeholder="密碼" {...password} />
				<input className={style.password} type="password" placeholder="確認密碼" {...repeated_password} />
				<button onClick={() => signup_request(name.value, password.value, repeated_password.value)}>
					註冊帳號
				</button>
			</div>
		</div>;
	} else if (err) {
		return <div className={style.signupPage}>
			<div className={style.signupForm}>
				<div className={style.counter}>註冊碼已過期或不存在！</div>
			</div>
		</div>;
	} else {
		return <></>;
	}
}