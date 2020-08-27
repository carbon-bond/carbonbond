import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';
import useOnClickOutside from 'use-onclickoutside';

import '../css/header.css';

import { API_FETCHER, unwrap } from '../ts/api/api';
import { isEmail } from '../ts/regex_util';
import { useInputValue } from './utils';
import { UserState } from './global_state/user';

function _Header(props: RouteComponentProps): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	const [logining, setLogining] = React.useState(false);
	const [signuping, setSignuping] = React.useState(false);
	const { user_state, setLogin, setLogout } = UserState.useContainer();

	async function login_request(name: string, password: string): Promise<void> {
		try {
			let user = unwrap(await API_FETCHER.login(password, name));
			setLogining(false);
			if (user) {
				setLogin({
					user_name: user.user_name,
					energy: user.energy,
				});
				toast('登入成功');
			} else {
				toast('帳號或密碼錯誤');
			}
		} catch (err) {
			toast.error(err);
		}
		return;
	}
	async function logout_request(): Promise<{}> {
		try {
			unwrap(await API_FETCHER.logout());
			setLogout();
			setExtended(false);
			toast('您已登出');
		} catch (err) {
			toast.error(err);
		}
		return {};
	}
	function SignupModal(): JSX.Element {
		const [signup_sent, setSignupSent] = React.useState(false);
		let email = useInputValue('').input_props;
		let ref_all = React.useRef(null);
		useOnClickOutside(ref_all, () => setSignuping(false));
		async function signup_request(email: string): Promise<void> {
			try {
				if (!isEmail(email)) {
					throw '信箱格式異常';
				}
				unwrap(await API_FETCHER.sendSignupEmail(email));
				setSignupSent(true);
			} catch (err) {
				toast.error(err);
			}
			return;
		}
		if (signuping) {
			return <div ref={ref_all} styleName="signupModal">
				<div styleName="escape" onClick={() => setSignuping(false)}>✗</div>
				<input type="text" placeholder="😎 信箱" autoFocus {...email} />
				{
					(() => {
						if (signup_sent) {
							return <>
								<p>已寄出註冊碼</p>
								<button onClick={() => signup_request(email.value)}>再次寄發註冊信</button>
							</>;
						} else {
							return <>
								<button onClick={() => signup_request(email.value)}>寄發註冊信</button>
							</>;
						}
					})()
				}
			</div>;
		} else {
			return <></>;
		}
	}
	function LoginModal(): JSX.Element {
		let name = useInputValue('').input_props;
		let password = useInputValue('').input_props;
		let ref_all = React.useRef(null);
		useOnClickOutside(ref_all, () => setLogining(false));

		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter') {
				login_request(name.value, password.value);
			} else if (e.key == 'Escape') {
				setLogining(false);
			}
		}

		if (logining) {
			return <div ref={ref_all} styleName="loginModal">
				<div styleName="escape" onClick={() => setLogining(false)}>✗</div>
				<input type="text" placeholder="😎 使用者名稱" autoFocus {...name} onKeyDown={onKeyDown} />
				<input type="password" placeholder="🔒 密碼" {...password} onKeyDown={onKeyDown} />
				<button onClick={() => login_request(name.value, password.value)}>登入</button>
			</div>;
		} else {
			return <></>;
		}
	}

	function Dropdown(): JSX.Element {
		if (extended && user_state.login) {
			return <div styleName="dropdown">
				<div styleName="triangle"> </div>
				<div styleName="features">
					<div styleName="feature">🏯 我的個板</div>
					<div styleName="feature" onClick={() => props.history.push(`/app/user/${user_state.user_name}`)}>📜 我的卷宗</div>
					<div styleName="feature" onClick={() => props.history.push('/app/party')}>👥 我的政黨</div>
					<div styleName="feature" onClick={() => logout_request()}>🏳 登出</div>
					<div styleName="feature">⚙ 設定</div>
				</div>
			</div>;
		} else {
			return <></>;
		}
	}
	function UserStatus(): JSX.Element {
		let ref = React.useRef(null);
		useOnClickOutside(ref, () => setExtended(false));
		if (user_state.login) {
			return <>
				<div styleName="icon">♡</div>
				<div styleName="icon">☠</div>
				<div styleName="icon">🗞️</div>
				<div ref={ref} styleName="wrap">
					<div styleName="userInfo" onClick={() => setExtended(!extended)}>
						<img src={`/avatar/${user_state.user_name}`} />
						<div styleName="userName">{user_state.user_name}</div>
						<div styleName="energy">☘ {user_state.energy}</div>
					</div>
					<Dropdown />
				</div>
			</>;
		} else {
			return <div styleName="wrap">
				<div styleName="login" onClick={() => setLogining(true)}>登入 🔫</div>
				<div styleName="login" onClick={() => setSignuping(true)}>註冊 ⭐</div>
			</div>;
		}
	}
	return (
		<div className="header" styleName="header">
			<LoginModal />
			<SignupModal />
			<div styleName="container">
				<div styleName="leftSet">
					<div styleName="carbonbond" onClick={() => props.history.push('/app')}>
						<img src="/img/icon_with_text.png" alt="" />
					</div>
					<div styleName="location">全站熱門</div>
					<div styleName="searchPart" contentEditable={true} placeholder="搜尋全站">
					</div>
				</div>

				<div styleName="rightSet">
					{UserStatus()}
				</div>
			</div>
		</div>
	);
}

const Header = withRouter(_Header);

export { Header };
