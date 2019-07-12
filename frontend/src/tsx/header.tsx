import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';
import useOnClickOutside from 'use-onclickoutside';

import '../css/header.css';

import * as api from './api';
import { useInputValue } from './utils';
import { UserState } from './global_state';

function _Header(props: RouteComponentProps): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	const [logining, setLogining] = React.useState(false);
	const { user_state, set_login, set_logout } = UserState.useContainer();

	async function login_request(id: string, password: string): Promise<{}> {
		try {
			await api.login_request(id, password);
			setLogining(false);
			set_login(id);
			toast('登入成功');
		} catch (err) {
			// console.log(JSON.stringify(err.response));
			toast(err.message.split(':')[0]);
			// TODO: 應該想辦法做更精細的錯誤處理
		}
		return {};
	}
	async function logout_request(): Promise<{}> {
		try {
			await api.logout_request();
			set_logout();
			setExtended(false);
			toast('您已登出');
		} catch (err) {
			toast(err.message.split(':')[0]);
			// TODO: 應該想辦法做更精細的錯誤處理
		}
		return {};
	}
	function LoginModal(): JSX.Element {
		let id = useInputValue('');
		let password = useInputValue('');
		let ref_all = React.useRef(null);
		let ref_id = React.useRef<HTMLInputElement>(null);
		useOnClickOutside(ref_all, () => setLogining(false));

		function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
			if (e.key == 'Enter') {
				login_request(id.value, password.value);
			} else if (e.key == 'Escape') {
				setLogining(false);
			}
		}

		React.useEffect(() => {
			if (ref_id && ref_id.current) { // 判斷式只是爲了 TS 的型別檢查
				ref_id.current.focus();
			}
		}, []);

		if (logining) {
			return <div ref={ref_all} styleName="loginModal">
				<div styleName="escape" onClick={ () => setLogining(false) }>✗</div>
				<input ref={ref_id} type="text" placeholder="😎 使用者名稱" {...id} onKeyDown={onKeyDown} />
				<input type="password" placeholder="🔒 密碼" {...password} onKeyDown={onKeyDown} />
				<button onClick={ () => login_request(id.value, password.value) }>登入</button>
			</div>;
		} else {
			return <></>;
		}
	}

	function Dropdown(): JSX.Element {
		if (extended) {
			return <div styleName="dropdown">
				<div styleName="triangle"> </div>
				<div styleName="features">
					<div styleName="feature">🏯 我的城堡</div>
					<div styleName="feature">🏆 榮耀／卷宗</div>
					<div styleName="feature">🖅 寄發邀請信</div>
					<div styleName="feature" onClick={ () => props.history.replace('/app/party') }>👥 政黨</div>
					<div styleName="feature" onClick={ () => logout_request() }>🏳 登出</div>
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
				<div styleName="carbonbond" onClick={ () => props.history.replace('app') }>
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

const Header = withRouter(_Header);

export { Header };