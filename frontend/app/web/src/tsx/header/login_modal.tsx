import { UserState } from '../global_state/user';
import { toastErr, useInputValue } from '../utils';
import useOnClickOutside from 'use-onclickoutside';
import * as React from 'react';
import { toast } from 'react-toastify';
import { ModalButton, ModalWindow } from '../components/modal_window';
import { isEmail } from '../../ts/regex_util';
import style from '../../css/header/login_modal.module.css';
import { API_FETCHER, unwrap } from 'carbonbond-api/api_utils';
import { ModalStatus } from '.';

function LoginStatus(
	props: {
		setModalStatus: (modal_stauts: ModalStatus | null) => void,
	}
): JSX.Element {
	const [password_visible, SetPasswordVisible] = React.useState(false);
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	const { setLogin } = UserState.useContainer();
	async function login_request(name: string, password: string): Promise<void> {
		try {
			let user = unwrap(await API_FETCHER.userQuery.login(name, password));
			props.setModalStatus(null);
			if (user) {
				setLogin({
					user_name: user.user_name,
					sentence: user.sentence,
					id: user.id,
					is_robot: user.is_robot,
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
		if (e.keyCode == 13) {
			login_request(name.value, password.value);
		} else if (e.key == 'Escape') {
			props.setModalStatus(null);
		}
	}

	const buttons: ModalButton[] = [
		{ text: '登入', handler: () => login_request(name.value, password.value) },
		{ text: '取消', handler: () => props.setModalStatus(null) }
	];

	function getBody(): JSX.Element {
		return <div className={style.loginModal}>
			<div>
				<input type="text" className={style.inputContainer} placeholder="😎 使用者名稱" autoFocus {...name} onKeyDown={onKeyDown} />
				<div className={style.inputContainer}>
					<input type={password_visible ? 'text' : 'password'} className={style.password} placeholder="🔒 密碼" {...password} onKeyDown={onKeyDown} />
					<span className={style.eye} onClick={() => {SetPasswordVisible(!password_visible);}}>{password_visible ? '🙈' : '👁️'}</span>
				</div>
				<div
					className={style.fogetPassword}
					onClick={() => { props.setModalStatus(ModalStatus.ForgetPassword); }}>
					忘記密碼？
				</div>
			</div>
		</div>;
	}

	function getSecondBody(): JSX.Element {
		return <div
			className={style.noAccount}
			onClick={() => { props.setModalStatus(ModalStatus.Signup); }}>
			還沒有帳號嗎？點此創建
		</div>;
	}

	return <ModalWindow
		title="登入"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={() => {props.setModalStatus(null);}}
		second_body={getSecondBody()}
	/>;
}

function ForgetPasswordStatus(
	props: {
		setModalStatus: (modal_stauts: ModalStatus | null) => void,
	}
): JSX.Element {
	console.log('fogot');
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
		return <div className={style.loginModal}>
			<input
				className={style.inputContainer}
				type="text"
				placeholder="📧 信箱"
				autoFocus {...email} />
			{
				sent ?
					<p>已寄出重置密碼信</p> :
					<p>&nbsp;</p>
			}
		</div>;
	}
	const buttons: ModalButton[] = [
		{ text: sent ? '再一次' : '重置密碼', handler: () => reset_password_request(email.value) },
		{ text: '返回', handler: () => props.setModalStatus(ModalStatus.Login) }
	];
	return <ModalWindow
		title="找回密碼"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={() => {props.setModalStatus(null);}}
	/>;
}

export function SignupStatus(
	props: {
		setModalStatus: (modal_stauts: ModalStatus | null) => void,
	}): JSX.Element {
	let email = useInputValue('').input_props;
	async function signup_request(email: string): Promise<void> {
		if (!isEmail(email)) {
			toast.error('電子信箱格式不符');
			return;
		}
		try {
			unwrap(await API_FETCHER.userQuery.sendSignupEmail(email, false));
			toast(`註冊信已送出，請至 ${email} 查收`);
		} catch (err) {
			toastErr(err);
		}
		props.setModalStatus(null);
	}
	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
		if (e.keyCode == 13) {
			signup_request(email.value);
		} else if (e.key == 'Escape') {
			props.setModalStatus(null);
		}
	}

	const buttons: ModalButton[] = [
		{ text: '註冊', handler: () => signup_request(email.value) },
		{ text: '取消', handler: () => props.setModalStatus(null) }
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
		setVisible={() => {props.setModalStatus(null);}}
	/>;
}

export function LoginModal(
	props: {
		setModalStatus: (modal_stauts: ModalStatus | null) => void,
		modal_status: ModalStatus
	}
): JSX.Element {
	let ref_all = React.useRef(null);
	useOnClickOutside(ref_all, () => { props.setModalStatus(null); });
	console.log(props.modal_status);
	switch (props.modal_status) {
		case ModalStatus.Signup:
			return <SignupStatus {...props} />;
		case ModalStatus.Login:
			return <LoginStatus {...props}/>;
		case ModalStatus.ForgetPassword:
			return <ForgetPasswordStatus {...props}/>;
	}
}