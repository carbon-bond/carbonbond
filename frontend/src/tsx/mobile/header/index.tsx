import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import style from '../../../css/header.module.css';

import { UserState } from '../../global_state/user';
import { BoardCacheState } from '../../global_state/board_cache';

import { Menu } from './menu';
import { DropDown } from '../../components/drop_down';
import { SearchBar } from '../../header/search_bar';

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
	const { user_state } = UserState.useContainer();
	const { cur_board } = BoardCacheState.useContainer();
	const [ expanding_menu, setExpandingMenu ] = React.useState(false);

	function UserBlock(): JSX.Element | null {
		if (!user_state.login) {
			return null;
		}
		return <div className={style.userInfo}>
			<img src={`/avatar/${user_state.user_name}`} />
			<div className={style.userName}>{user_state.user_name}</div>
			<div className={style.energy}>☘ {user_state.energy}</div>
		</div>;
	}
	function UserStatus(): JSX.Element {
		return <>
			{
				// user_state.login ? <div className={style.icon}>🔔</div> : null
			}
			<div className={style.wrap}>
				<DropDown
					hide_triangle
					forced_expanded={expanding_menu}
					button={<div className={style.icon} onClick={() => setExpandingMenu(p => !p)}> ☰ </div>}
					body={<Menu
						userBlock={<UserBlock/>}
						onCoverClicked={() => setExpandingMenu(false)}/>}
				/>
			</div>
		</>;
	}
	let title = cur_board ? cur_board : '全站熱門'; // XXX: 全站熱門以外的？
	return (
		<div className={`header ${style.header}`}>
			<div className={style.container}>
				<div className={style.leftSet}>
					<div className={style.carbonbond} onClick={() => props.history.push('/app')}>
						<img src="/img/icon.png" alt="" />
					</div>
					<div className={style.location} style={{ fontSize: 14 }}>{title}</div>
					<SearchBar history={props.history} cur_board={cur_board} hide_select_board/>
				</div>
				<div className={style.rightSet}>
					<UserStatus/>
				</div>
			</div>
		</div>
	);
}

const Header = withRouter(_Header);

export { Header };
