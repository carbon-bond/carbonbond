import { UserState } from '../global_state/user';
import { toastErr, useInputValue } from '../utils';
import useOnClickOutside from 'use-onclickoutside';
import * as React from 'react';
import { toast } from 'react-toastify';
import { ModalButton, ModalWindow } from '../components/modal_window';
import { isEmail } from '../../ts/regex_util';
import style from '../../css/header/login_modal.module.css';
import { API_FETCHER, unwrap } from 'carbonbond-api/api_utils';

enum Status {
	ForgetPassword,
	Login
};

function LoginStatus(
	props: {
		setLogining: (logining: boolean) => void,
		setStatus: (status: Status) => void
	}
): JSX.Element {
	const [password_visible, SetPasswordVisible] = React.useState(false);
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	const { setLogin } = UserState.useContainer();
	async function login_request(name: string, password: string): Promise<void> {
		try {
			let user = unwrap(await API_FETCHER.userQuery.login(name, password));
			props.setLogining(false);
			if (user) {
				setLogin({
					user_name: user.user_name,
					id: user.id,
					email: user.email,
					energy: user.energy,
					titles: user.titles
				});
				toast('登入成功');
			} else {
				toast('帳號或密碼錯誤');
			}
		} catch (err) {
			toastErr(err);
		}
		return;
	}
	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
		if (e.key == 'Enter') {
			login_request(name.value, password.value);
		} else if (e.key == 'Escape') {
			props.setLogining(false);
		}
	}

	const buttons: ModalButton[] = [
		{ text: '登入', handler: () => login_request(name.value, password.value) },
		{ text: '取消', handler: () => props.setLogining(false) }
	];

	function getBody(): JSX.Element {
		return <div className={style.loginModal}>
			<div>
				<input type="text" className={style.inputContainer} placeholder="😎 使用者名稱" autoFocus {...name} onKeyDown={onKeyDown} />
				<div className={style.inputContainer}>
					<input type={password_visible ? 'text' : 'password'} className={style.password} placeholder="🔒 密碼" {...password} onKeyDown={onKeyDown} />
					<span className={style.eye} onClick={() => {SetPasswordVisible(!password_visible);}}>{password_visible ? '🙈' : '👁️'}</span>
				</div>
				<div className={style.fogetPassword} onClick={() => {props.setStatus(Status.ForgetPassword);}}>忘記密碼？</div>
			</div>
		</div>;
	}

	return <ModalWindow
		title="登入"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setLogining}
	/>;
}

function ForgetPasswordStatus(
	props: {
		setLogining: (logining: boolean) => void,
		setStatus: (status: Status) => void
	}
): JSX.Element {
	const [sent, setSent] = React.useState(false);
	let email = useInputValue('').input_props;
	async function reset_password_request(email: string): Promise<void> {
		try {
			if (!isEmail(email)) {
				throw '信箱格式異常';
			}
			unwrap(await API_FETCHER.userQuery.sendResetPasswordEmail(email));
			setSent(true);
		} catch (err) {
			toastErr(err);
		}
		return;
	}

	function getBody(): JSX.Element {
		return <div className={style.signupModal}>
			<input type="text" placeholder="😎 信箱" autoFocus {...email} />
			{
				sent ?
					<p>已寄出重置密碼信</p> :
					<p>&nbsp;</p>
			}
		</div>;
	}
	const buttons: ModalButton[] = [
		{ text: sent ? '再一次' : '重置密碼', handler: () => reset_password_request(email.value) },
		{ text: '返回', handler: () => props.setStatus(Status.Login) }
	];
	return <ModalWindow
		title="找回密碼"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setLogining}
	/>;
}

export function LoginModal(props: { setLogining: (logining: boolean) => void }): JSX.Element {
	let ref_all = React.useRef(null);
	const [status, setStatus] = React.useState<Status>(Status.Login);
	useOnClickOutside(ref_all, () => { props.setLogining(false); });
	switch (status) {
		case Status.Login:
			return <LoginStatus {...props} setStatus={setStatus}/>;
		case Status.ForgetPassword:
			return <ForgetPasswordStatus {...props} setStatus={setStatus}/>;
	}
}

export function SignupModal(props: {setSignuping: (signing: boolean) => void}): JSX.Element {
	let email = useInputValue('').input_props;
	async function signup_request(email: string): Promise<void> {
		if (!isEmail(email)) {
			toast.error('電子信箱格式不符');
			return;
		}
		try {
			unwrap(await API_FETCHER.userQuery.sendSignupEmail(email, false));
		} catch (err) {
			toastErr(err);
		}
		toast(`註冊信已送出，請至 ${email} 查收`);
		props.setSignuping(false);
	}
	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
		if (e.key == 'Enter') {
			signup_request(email.value);
		} else if (e.key == 'Escape') {
			props.setSignuping(false);
		}
	}

	const buttons: ModalButton[] = [
		{ text: '註冊', handler: () => signup_request(email.value) },
		{ text: '取消', handler: () => props.setSignuping(false) }
	];

	function getBody(): JSX.Element {
		return <div className={style.loginModal}>
			<div>
				<input
					type="text"
					className={style.inputContainer}
					placeholder="📧 信箱"
					autoFocus
					{...email}
					onKeyDown={onKeyDown} />
			</div>
		</div>;
	}

	return <ModalWindow
		title="註冊"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setSignuping}
	/>;
}
