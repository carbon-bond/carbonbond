import * as React from 'react';
import '../css/header.css';
import { UserState } from './global_state';
import { GraphQLClient } from 'graphql-request';

type InputEvent = React.ChangeEvent<HTMLInputElement>;

function useInputValue(initialValue: string = ''): { value: string, onChange: (e: InputEvent) => void } {
	const [value, setValue] = React.useState<string>(initialValue);
	return {
		value: value,
		onChange: (event: InputEvent) => setValue(event.target.value)
	};
}


function Header(): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	const [logining, setLogining] = React.useState(false);
	const { user_state, set_login, set_logout } = UserState.useContainer();
	// useGetLoginState();

	async function login_request(id: string, password: string): Promise<{}> {
		const endpoint = 'http://localhost:8080/api';
		const graphQLClient = new GraphQLClient(endpoint);
		const query = `
			mutation {
				login(id: "${id}", password: "${password}") {
					message
				}
			}
		`;
		try {
			const data: { login: null | { message: string } } = await graphQLClient.request(query);
			if (data.login == null) {
				setLogining(false);
				set_login(id);
			}
			console.log(JSON.stringify(data, undefined, 2));
		} catch (err) {
			console.error(err);
		}
		return {};
	}

	function LoginModal(): JSX.Element {
		let id = useInputValue('');
		let password = useInputValue('');
		if (logining) {
			return <div styleName="loginModal">
				<div styleName="escape" onClick={ () => setLogining(false) }>✗</div>
				<input type="text" placeholder="😎 使用者名稱" {...id} />
				<input type="password" placeholder="🔒 密碼" {...password} />
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
					<div styleName="feature" onClick={ () => { set_logout(); setExtended(false); } }>🏳 登出</div>
					<div styleName="feature">⚙ 設定</div>
				</div>
			</div>;
		} else {
			return <></>;
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
					{Dropdown()}
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
			{ LoginModal() }
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