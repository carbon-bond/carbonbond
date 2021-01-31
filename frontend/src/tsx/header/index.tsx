import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';
import useOnClickOutside from 'use-onclickoutside';

import '../../css/header.css';

import { API_FETCHER, unwrap } from '../../ts/api/api';
import { isEmail } from '../../ts/regex_util';
import { toastErr, useInputValue } from '../utils';
import { UserState } from '../global_state/user';
import { SearchBar } from './search_bar';
import { BoardCacheState } from '../global_state/board_cache';
import { NotificationIcon, NotificationQuality } from './notification';
import { Notification } from '../../ts/api/api_trait';
import { DropDown } from '../components/drop_down';
import { ModalButton, ModalWindow } from '../components/modal_window';

export function Row<T>(props: { children: T, onClick?: () => void }): JSX.Element {
	return <div styleName="row" onClick={() => {
		if (typeof props.onClick != 'undefined') {
			props.onClick();
		}
	}}>
		<div styleName="space" />
		<div>{props.children}</div>
		<div styleName="space" />
	</div>;
}

function _Header(props: RouteComponentProps): JSX.Element {
	const [logining, setLogining] = React.useState(false);
	const [signuping, setSignuping] = React.useState(false);
	const { user_state, setLogout } = UserState.useContainer();
	const { cur_board } = BoardCacheState.useContainer();

	let [expanding_user, setExpandingUser] = React.useState(false);
	let [expanding_quality, setExpandingQuality] = React.useState<null | NotificationQuality>(null);

	async function logout_request(): Promise<{}> {
		try {
			unwrap(await API_FETCHER.logout());
			setLogout();
			setExpandingUser(false);
			setExpandingQuality(null);
			toast('您已登出');
		} catch (err) {
			toastErr(err);
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
				toastErr(err);
			}
			return;
		}
		let buttons: ModalButton[] = [];
		buttons.push({ text: signup_sent ? '再次寄發註冊信' : '寄發註冊信', handler: () => signup_request(email.value) });
		buttons.push({ text: '✗', handler: () => setSignuping(false) });

		function getBody(): JSX.Element {
			return <div styleName="signupModal">
				<input type="text" placeholder="😎 信箱" autoFocus {...email} />
				{
					(() => {
						if (signup_sent) {
							return <>
								<p>已寄出註冊碼</p>
							</>;
						} else {
							return <>
								<p>&nbsp;</p>
							</>;
						}
					})()
				}
			</div>;
		}

		return <ModalWindow
			title="註冊"
			body={getBody()}
			buttons={buttons}
			visible={signuping}
			setVisible={setSignuping}
		/>;
	}

	function DropdownBody(): JSX.Element {
		if (user_state.login) {
			return <div styleName="dropdown">
				<div styleName="features">
					<Row onClick={() => props.history.push(`/app/user_board/${user_state.user_name}`)}>🏯 我的個板</Row>
					<Row onClick={() => props.history.push(`/app/user/${user_state.user_name}`)}>📜 我的卷宗</Row>
					<Row onClick={() => props.history.push('/app/party')}>👥 我的政黨</Row>
					<Row onClick={() => logout_request()}>🏳 登出</Row>
					<Row>⚙ 設定</Row>
				</div>
			</div>;
		} else {
			return <></>;
		}
	}
	function UserStatus(): JSX.Element {
		let ref_noti = React.useRef(null);
		let ref_user = React.useRef(null);
		let [notifications, setNotifications] = React.useState<Notification[] | null>(null);
		React.useEffect(() => {
			if (!user_state.login) {
				return;
			}
			API_FETCHER.queryNotificationByUser(true).then((res) => {
				if ('Err' in res) {
					toastErr(res.Err);
					return;
				}
				setNotifications(res.Ok);
			});
		}, [user_state.login]);
		useOnClickOutside(ref_noti, () => {
			setExpandingQuality(null);
		});
		useOnClickOutside(ref_user, () => {
			setExpandingUser(false);
		});
		if (user_state.login) {
			return <>
				<div ref={ref_noti} styleName="wrap">
					<NotificationIcon icon={'🤍'}
						expanding_quality={expanding_quality} quality={NotificationQuality.Good}
						notifications={notifications} setExpandingQuality={q => setExpandingQuality(q)} />
					<NotificationIcon icon={'🗞️'}
						expanding_quality={expanding_quality} quality={NotificationQuality.Neutral}
						notifications={notifications} setExpandingQuality={q => setExpandingQuality(q)} />
					<NotificationIcon icon={'☠️'}
						expanding_quality={expanding_quality} quality={NotificationQuality.Bad}
						notifications={notifications} setExpandingQuality={q => setExpandingQuality(q)} />
				</div>
				<div styleName="space"/>
				<div ref={ref_user} styleName="wrap">
					<DropDown
						forced_expanded={expanding_user}
						button={
							<div styleName="userInfo" onClick={() => setExpandingUser(!expanding_user)}>
								<img src={`/avatar/${user_state.user_name}`} />
								<div styleName="userName">{user_state.user_name}</div>
								<div styleName="energy">☘ {user_state.energy}</div>
							</div>}
						body={<DropdownBody />}
					/>
				</div>
			</>;
		} else {
			return <div styleName="wrap">
				<div styleName="login" onClick={() => setLogining(true)}>登入 🔫</div>
				<div styleName="login" onClick={() => setSignuping(true)}>註冊 ⭐</div>
			</div>;
		}
	}
	let title = cur_board ? cur_board : '全站熱門'; // XXX: 全站熱門以外的？
	return (
		<div className="header" styleName="header">
			<LoginModal logining={logining} setLogining={setLogining}/>
			<SignupModal />
			<div styleName="container">
				<div styleName="space"/>
				<div styleName="leftSet">
					<div styleName="carbonbond" onClick={() => props.history.push('/app')}>
						<img src="/img/icon_with_text.png" alt="" />
					</div>
					<div styleName="location">{title}</div>
					<SearchBar history={props.history} cur_board={cur_board} />
				</div>
				<div styleName="space"/>

				<div styleName="rightSet">
					<UserStatus/>
				</div>
			</div>
		</div>
	);
}

const Header = withRouter(_Header);

export function LoginModal(props: {logining: boolean, setLogining: (logining: boolean) => void}): JSX.Element {
	const { setLogin } = UserState.useContainer();
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	let ref_all = React.useRef(null);
	useOnClickOutside(ref_all, () => props.setLogining(false));

	async function login_request(name: string, password: string): Promise<void> {
		try {
			let user = unwrap(await API_FETCHER.login(name, password));
			props.setLogining(false);
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

	let buttons: ModalButton[] = [];
	buttons.push({ text: '登入', handler: () => login_request(name.value, password.value) });
	buttons.push({ text: '✗', handler: () => props.setLogining(false) });

	function getBody(): JSX.Element {
		return <div styleName="loginModal">
			<input type="text" placeholder="😎 使用者名稱" autoFocus {...name} onKeyDown={onKeyDown} />
			<input type="password" placeholder="🔒 密碼" {...password} onKeyDown={onKeyDown} />
		</div>;
	}

	return <ModalWindow
		title="登入"
		body={getBody()}
		buttons={buttons}
		visible={props.logining}
		setVisible={props.setLogining}
	/>;
}


export { Header };
