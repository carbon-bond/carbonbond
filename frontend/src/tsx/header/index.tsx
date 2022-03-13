import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';
import useOnClickOutside from 'use-onclickoutside';

import style from '../../css/header/index.module.css';

import carbonbondTextURL from '../../img/text.png';
import carbonbondIconURL from '../../img/icon.png';

import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import { UserState } from '../global_state/user';
import { SearchBar } from './search_bar';
import { BoardCacheState } from '../global_state/board_cache';
import { NotificationIcon, NotificationQuality } from './notification';
import { Notification } from '../../ts/api/api_trait';
import { DropDown } from '../components/drop_down';
import { SignupModal, LoginModal } from './login_modal';

export function Row<T>(props: { children: T, onClick?: () => void }): JSX.Element {
	return <div className={style.row} onClick={() => {
		if (typeof props.onClick != 'undefined') {
			props.onClick();
		}
	}}>
		<div className={style.space} />
		<div>{props.children}</div>
		<div className={style.space} />
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
			unwrap(await API_FETCHER.userQuery.logout());
			setLogout();
			setExpandingUser(false);
			setExpandingQuality(null);
			toast('您已登出');
		} catch (err) {
			toastErr(err);
		}
		return {};
	}

	function DropdownBody(): JSX.Element {
		if (user_state.login) {
			return <div className={style.dropdown}>
				<div className={style.features}>
					<Row onClick={() => props.history.push(`/app/user_board/${user_state.user_name}`)}>🏯 我的個板</Row>
					<Row onClick={() => props.history.push(`/app/user/${user_state.user_name}`)}>📜 我的卷宗</Row>
					<Row onClick={() => props.history.push('/app/party')}>👥 我的政黨</Row>
					<Row onClick={() => props.history.push('/app/signup_invite')}>🎟️ 我的邀請碼</Row>
					<Row onClick={() => props.history.push('/app/setting')}>⚙ 設定</Row>
					<Row onClick={() => logout_request()}>🏳 登出</Row>
				</div>
			</div>;
		} else {
			return <></>;
		}
	}

	function UserStatus(): JSX.Element {
		let notifications = useNotification(user_state.login);
		let ref_noti = React.useRef(null);
		let ref_user = React.useRef(null);
		useOnClickOutside(ref_noti, () => {
			setExpandingQuality(null);
		});
		useOnClickOutside(ref_user, () => {
			setExpandingUser(false);
		});
		if (user_state.login) {
			return <>
				<div ref={ref_noti} className={style.wrap}>
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
				<div className={style.space} />
				<div ref={ref_user} className={style.wrap}>
					<DropDown
						forced_expanded={expanding_user}
						button={
							<div className={style.userInfo} onClick={() => setExpandingUser(!expanding_user)}>
								<img src={`/avatar/${user_state.user_name}`} />
								<div className={style.userName}>{user_state.user_name}</div>
								<div className={style.energy}>☘ {user_state.energy}</div>
							</div>}
						body={<DropdownBody />}
					/>
				</div>
			</>;
		} else {
			return <div className={style.wrap}>
				<div className={style.login} onClick={() => setLogining(true)}>登入 🔫</div>
				<div className={style.login} onClick={() => setSignuping(true)}>註冊 ⭐</div>
			</div>;
		}
	}
	let title = cur_board ? cur_board : '全站熱門'; // XXX: 全站熱門以外的？
	return (
		<div className={`header ${style.header}`}>
			{logining ? <LoginModal setLogining={setLogining} /> : null}
			{signuping ? <SignupModal setSignuping={setSignuping}/> : null}
			<div className={style.container}>
				<div className={style.leftSet}>
					<div className={style.carbonbond} onClick={() => props.history.push('/app')}>
						{/* TODO: 修正 vite 路徑 */}
						<img className={style.imageIcon} src={carbonbondIconURL} alt="" />
						<img className={style.imageText} src={carbonbondTextURL} alt="" />
					</div>
					<div className={style.location}>{title}</div>
				</div>
				<div className={style.middleSet}>
					<SearchBar history={props.history} cur_board={cur_board} />
				</div>
				<div className={style.rightSet}>
					{UserStatus()}
				</div>
			</div>
		</div>
	);
}

const Header = withRouter(_Header);

function useNotification(login: boolean): Notification[] | null {
	let [notifications, setNotifications] = React.useState<Notification[] | null>(null);
	React.useEffect(() => {
		if (!login) {
			return;
		}
		API_FETCHER.notificationQuery.queryNotificationByUser(true).then((res) => {
			if ('Err' in res) {
				toastErr(res.Err);
				return;
			}
			setNotifications(res.Ok);
		});
	}, [login]);
	return notifications;
}

export { Header };
