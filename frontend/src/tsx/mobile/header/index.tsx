import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import useOnClickOutside from 'use-onclickoutside';

import '../../../css/header.css';

import { UserState } from '../../global_state/user';
import { BoardCacheState } from '../../global_state/board_cache';

import { Menu } from './menu';
import { DropDown } from '../../components/drop_down';

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
	const { user_state } = UserState.useContainer();
	const { cur_board } = BoardCacheState.useContainer();
	const [ expanding_menu, setExpandingMenu ] = React.useState(false);

	function UserBlock(): JSX.Element | null {
		if (!user_state.login) {
			return null;
		}
		return <div styleName="userInfo">
			<img src={`/avatar/${user_state.user_name}`} />
			<div styleName="userName">{user_state.user_name}</div>
			<div styleName="energy">☘ {user_state.energy}</div>
		</div>;
	}
	function UserStatus(): JSX.Element {
		let ref = React.useRef(null);
		useOnClickOutside(ref, () => setExpandingMenu(false));
		return <>
			{
				user_state.login ? <div styleName="icon">🔔</div> : null
			}
			<div ref={ref} styleName="wrap">
				<DropDown
					hide_triangle
					forced_expanded={expanding_menu}
					button={<div styleName="icon" onClick={() => setExpandingMenu(p => !p)}> ☰ </div>}
					body={<Menu
						userBlock={<UserBlock/>}
						onCoverClicked={() => setExpandingMenu(false)}/>}
				/>
			</div>
		</>;
	}
	let title = cur_board ? cur_board : '全站熱門'; // XXX: 全站熱門以外的？
	return (
		<div className="header" styleName="header">
			<div styleName="container">
				<div styleName="leftSet">
					<div styleName="carbonbond" onClick={() => props.history.push('/app')}>
						<img src="/img/icon.png" alt="" />
					</div>
					<div styleName="location" style={{ fontSize: 14 }}>{title}</div>
				</div>
				<div style={{ flex: 1 }}/>
				<div styleName="rightSet">
					<UserStatus/>
				</div>
			</div>
		</div>
	);
}

const Header = withRouter(_Header);

export { Header };
