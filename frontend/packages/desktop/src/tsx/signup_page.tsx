import * as React from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router';
import { toastErr } from './utils';
import style from '../css/signup_page.module.css';
import { API_FETCHER } from '../ts/api/api';
import type { Error } from '../ts/api/api_trait';
import { UserState } from './global_state/user';
import { ConfigState } from './global_state/config';
import { useForm } from 'react-hook-form';
import { InvalidMessage } from './components/invalid_message';

export function SignupPage(): JSX.Element {
	let [email, setEmail] = React.useState<null | string>(null);
	let [err, setErr] = React.useState<Error | null>(null);
	let params = useParams<{token: string}>();
	let token = params.token!;
	let navigate = useNavigate();
	let { getLoginState } = UserState.useContainer();
	let { server_config } = ConfigState.useContainer();
	const {
		register,
		handleSubmit,
		watch,
		errors
	} = useForm({mode: 'onSubmit'});

	const password = React.useRef({});
	password.current = watch('password', '');

	async function signup_request(name: string, password: string): Promise<void> {
		try {
			await API_FETCHER.userQuery.signup(name, password, token);
			navigate('/app/');
			getLoginState();
			toast('註冊成功');
		} catch (err) {
			toastErr(err);
		}
	}

	React.useEffect(() => {
		API_FETCHER.userQuery.queryEmailByToken(token).then(res => {
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

	const onSubmit = (data: {name: string, password: string}): void => {
		signup_request(data.name, data.password);
	};

	const min_length = server_config.min_password_length;
	const max_length = server_config.max_password_length;
	const length_limit = {
		required: {
			value: true,
			message: '必填'
		},
		minLength: {
			value: min_length,
			message: `密碼長度至少 ${min_length}`
		},
		maxLength: {
			value: max_length,
			message: `密碼長度不可超過 ${max_length}`
		},
	};

	if (email) {
		return <div className={style.signupPage}>
			<div className={style.signupForm}>
				<div className={style.counter}>你的email是：　{email}　</div>
				<form onSubmit={handleSubmit(onSubmit)}>
					<input className={style.username} type="text" placeholder="使用者名稱" name="name" ref={register({ required: {value: true, message: '必填'} })} autoFocus />
					{errors.name && <InvalidMessage msg={errors.name.message} />}
					<input className={style.password} type="password" placeholder="密碼" name = "password" ref={register({
						...length_limit,
					})} />
					{errors.password && <InvalidMessage msg={errors.password.message} />}
					<input className={style.password} type="password" placeholder="確認密碼" name="repeat_password" ref={register({
						...length_limit,
						validate: value =>
							value === password.current || '兩次密碼輸入不同'
					})}  />
					{errors.repeat_password && <InvalidMessage msg={errors.repeat_password.message} />}
					<div>
						<button> 註冊帳號 </button>
					</div>
				</form>
				<div className={style.terms}>
					點擊註冊按鈕，代表你已同意
					<a target="_blank" href="/app/law/服務條款.md">服務條款</a>
					以及
					<a target="_blank" href="/app/law/論壇守則.md">論壇守則</a>
				</div>
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