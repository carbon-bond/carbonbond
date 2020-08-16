import * as React from 'react';
import { toast } from 'react-toastify';
import { RouteComponentProps } from 'react-router';
import { useInputValue } from './utils';
import '../css/signup_page.css';
import { API_FETCHER, unwrap } from '../ts/api/api';

type Props = RouteComponentProps<{ signup_token: string }>;

export function SignupPage(props: Props): JSX.Element {
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	let repeated_password = useInputValue('').input_props;
	let [email, setEmail] = React.useState<null | string>(null);
	let [err, setErr] = React.useState<any>(null);
	let signup_token = props.match.params.signup_token;

	async function signup_request(name: string, password: string, repeated_password: string): Promise<void> {
		try {
			if (repeated_password != password) {
				throw '兩次密碼輸入不同';
			}
			await API_FETCHER.signup(password, signup_token, name);
			props.history.push('/app/');
			toast('註冊成功');
		} catch (err) {
			toast.error(err);
		}
	}

	React.useEffect(() => {
		API_FETCHER.queryEmailByToken(signup_token).then(res => {
			try {
				setEmail(unwrap(res));
			} catch (err) {
				setErr(err);
				toast.error(err);
			}
		})
	}, []);

	if (email) {
		return <div styleName="signupPage">
			<div styleName="signupForm">
				<div styleName="counter">你的email是：　{email}　</div>
				<input styleName="username" type="text" placeholder="使用者名稱" {...name} autoFocus />
				<input styleName="password" type="password" placeholder="密碼" {...password} autoFocus />
				<input styleName="password" type="password" placeholder="確認密碼" {...repeated_password} autoFocus />
				<button onClick={() => signup_request(name.value, password.value, repeated_password.value)}>
					註冊帳號
				</button>
			</div>
		</div>;
	} else if (err) {
		return <div styleName="signupPage">
			<div styleName="signupForm">
				<div styleName="counter">註冊碼已過期或不存在！</div>
			</div>
		</div>;
	} else {
		return <></>;
	}
}