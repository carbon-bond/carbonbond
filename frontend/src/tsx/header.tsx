import * as React from 'react';
import { toast } from 'react-toastify';
import useOnClickOutside from 'use-onclickoutside';

import '../css/header.css';

import * as api from './api';
import { useInputValue } from './utils';
import { UserState } from './global_state';

function Header(): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	const [logining, setLogining] = React.useState(false);
	const { user_state, set_login, set_logout } = UserState.useContainer();

	async function login_request(id: string, password: string): Promise<{}> {
		try {
			const data: api.LoginResponse = await api.login_request(id, password);
			if (data.login == null) {
				setLogining(false);
				set_login(id);
				toast('登入成功');
			} else {
				toast.error(data.login.message);
			}
		} catch (err) {
			console.error(err);
		}
		return {};
	}

	async function logout_request(): Promise<{}> {
		try {
			const data: api.LogoutResponse = await api.logout_request();
			if (data.logout == null) {
				set_logout();
				setExtended(false);
			} else {
				toast.error(data.logout.message);
			}
		} catch (err) {
			console.error(err);
		}
		return {};
	}

	function LoginModal(): JSX.Element {
		let id = useInputValue('');
		let password = useInputValue('');
		let ref = React.useRef(null);
		useOnClickOutside(ref, () => setLogining(false));
		function onKeyPress(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter') {
				login_request(id.value, password.value);
			}
		}
		if (logining) {
			return <div ref={ref} styleName="loginModal">
				<div styleName="escape" onClick={ () => setLogining(false) }>✗</div>
				<input type="text" placeholder="😎 使用者名稱" {...id} onKeyPress={onKeyPress} />
				<input type="password" placeholder="🔒 密碼" {...password} onKeyPress={onKeyPress} />
				<button onClick={ () => login_request(id.value, password.value) }>登入</button>
			</div>;
		} else {
			return <></>;
		}
	}

	function Dropdown(): JSX.Element {
		let ref = React.useRef(null);
		useOnClickOutside(ref, () => setExtended(false));

		if (extended) {
			return <div ref={ref} styleName="dropdown">
				<div styleName="triangle"> </div>
				<div styleName="features">
					<div styleName="feature">🏯 我的城堡</div>
					<div styleName="feature">🏆 榮耀／卷宗</div>
					<div styleName="feature" onClick={ () => logout_request() }>🏳 登出</div>
					<div styleName="feature">⚙ 設定</div>
				</div>
			</div>;
		} else {
			return <div ref={ref}></div>;
		}
	}
	function UserStatus(): JSX.Element {
		if (user_state.login) {
			return <>
				<div styleName="icon">♡</div>
				<div styleName="icon">☠</div>
				<div styleName="icon">🗞️</div>
				<div styleName="wrap">
					<div styleName="userInfo" onClick={() => setExtended(!extended)}>
						<div styleName="image">💂️</div>
						<div styleName="userName">{user_state.user_id}</div>
						<div styleName="energy">⚡ 275</div>
					</div>
					<Dropdown />
				</div>
			</>;
		} else {
			return <div styleName="wrap">
				<div styleName="login" onClick={ () => setLogining(true) }>登入 🔫</div>
			</div>;
		}
	}
	return (
		<div className="header" styleName="header">
			<LoginModal />
			<div styleName="leftSet">
				<div styleName="carbonbond">
					<img src="/img/icon.png" alt="" />
					碳鍵
				</div>
				<div styleName="location">全站熱門</div>
			</div>
			<div styleName="middleSet">
				<input type="text" placeholder="🔍 搜尋全站" />
			</div>
			<div styleName="rightSet">
				{ UserStatus() }
			</div>
		</div>
	);
}

export { Header };