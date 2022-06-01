import * as React from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import useOnClickOutside from 'use-onclickoutside';

import style from '../../css/header/index.module.css';

import carbonbondTextURL from '../../img/text.png';
import carbonbondIconURL from '../../img/icon-128x128.png';

import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import { UserState } from '../global_state/user';
import { SearchBar } from './search_bar';
import { ArticleLocation, LocationState } from '../global_state/location';
import { NotificationIcon } from './notification';
import { DropDown } from '../components/drop_down';
import { SignupModal, LoginModal } from './login_modal';
import { EditorPanelState } from '../global_state/editor_panel';
import { NotificationQuality } from '../global_state/notification';

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

function Header(): JSX.Element {
	const [logining, setLogining] = React.useState(false);
	const [signuping, setSignuping] = React.useState(false);
	const { user_state, setLogout } = UserState.useContainer();
	const { current_location } = LocationState.useContainer();
	const { setEditorPanelData } = EditorPanelState.useContainer();

	let [expanding_user, setExpandingUser] = React.useState(false);
	let [expanding_quality, setExpandingQuality] = React.useState<null | NotificationQuality>(null);

	async function logout_request(): Promise<{}> {
		try {
			unwrap(await API_FETCHER.userQuery.logout());
			setLogout();
			setExpandingUser(false);
			setExpandingQuality(null);
			// TODO: 詢問是否儲存草稿
			setEditorPanelData(null);
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
					<Link to={`/app/b/personal/${user_state.user_name}`}> <Row>🏯 我的個板</Row> </Link>
					<Link to={`/app/user/${user_state.user_name}`}> <Row>📜 我的卷宗</Row> </Link>
					<Link to={'/app/party'}> <Row>👥 我的政黨</Row> </Link>
					<Link to={'/app/signup_invite'}> <Row>🎟️ 我的邀請碼</Row> </Link>
					<Link to={'/app/setting'}> <Row>️⚙️  設定</Row> </Link>
					<Row onClick={() => logout_request()}>🏳 登出</Row>
				</div>
			</div>;
		} else {
			return <></>;
		}
	}

	function UserStatus(): JSX.Element {
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
						setExpandingQuality={q => setExpandingQuality(q)} />
					<NotificationIcon icon={'🗞️'}
						expanding_quality={expanding_quality} quality={NotificationQuality.Neutral}
						setExpandingQuality={q => setExpandingQuality(q)} />
					<NotificationIcon icon={'☠️'}
						expanding_quality={expanding_quality} quality={NotificationQuality.Bad}
						setExpandingQuality={q => setExpandingQuality(q)} />
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
	let title = current_location ? current_location.show_in_header() : '所有看板';
	function RouteToBoard(): string {
		if (current_location instanceof ArticleLocation) {
			return window.location.pathname.split('/').slice(0, -2).join('/');
		}
		return window.location.pathname;
	}

	return (
		<div className={`header ${style.header}`}>
			{logining ? <LoginModal setLogining={setLogining} /> : null}
			{signuping ? <SignupModal setSignuping={setSignuping}/> : null}
			<div className={style.container}>
				<div className={style.leftSet}>
					<Link to="/app">
						<div className={style.carbonbond}>
							<img className={style.imageIcon} src={carbonbondIconURL} alt="" />
							<img className={style.imageText} src={carbonbondTextURL} alt="" />
						</div>
					</Link>
					<Link to={RouteToBoard()}>
						<div className={style.location}>{title}</div>
					</Link>
				</div>
				<div className={style.middleSet}>
					<SearchBar cur_board={current_location ? current_location.show_in_header() : ''} />
				</div>
				<div className={style.rightSet}>
					{UserStatus()}
				</div>
			</div>
		</div>
	);
}

export { Header };
