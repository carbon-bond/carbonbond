import * as React from 'react';
import { toast } from 'react-toastify';
import { toastErr } from './utils';
import style from '../css/reset_password.module.css';
import { API_FETCHER, unwrap } from '../ts/api/api';
import type { Error } from '../ts/api/api_trait';
import { UserState } from './global_state/user';
import { ConfigState } from './global_state/config';
import { useForm } from 'react-hook-form';
import { InvalidMessage } from './components/invalid_message';
import { useNavigate, useParams } from 'react-router';

export function ResetPassword(): JSX.Element {
	let [user_name, setUserName] = React.useState<null | string>(null);
	let [err, setErr] = React.useState<Error | null>(null);
	let { getLoginState } = UserState.useContainer();
	let { server_config } = ConfigState.useContainer();
	let params = useParams<{token: string}>();
	let token = params.token!;
	let navigate = useNavigate();
	const {
		register,
		handleSubmit,
		watch,
		errors
	} = useForm({mode: 'onBlur'});

	const password = React.useRef({});
	password.current = watch('password', '');

	async function reset_password_request(password: string): Promise<void> {
		try {
			unwrap(await API_FETCHER.userQuery.resetPasswordByToken(password, token));
			navigate('/app/');
			getLoginState();
			toast('重設密碼成功，請再次登入');
		} catch (err) {
			toastErr(err);
		}
	}

	React.useEffect(() => {
		API_FETCHER.userQuery.queryUserNameByResetPasswordToken(token).then(res => {
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

	const onSubmit = (data: {password: string}): void => {
		reset_password_request(data.password);
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

	if (user_name) {
		return <div className={style.signupPage}>
			<div className={style.signupForm}>
				<div className={style.counter}> {user_name} ，歡迎歸來！　</div>
				<form onSubmit={handleSubmit(onSubmit)}>
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
						<button>
							重置密碼
						</button>
					</div>
				</form>
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