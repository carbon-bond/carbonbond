import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import '../../../css/header.css';

import { UserState } from '../../global_state/user';
import { BoardCacheState } from '../../global_state/board_cache';

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

	function UserStatus(): JSX.Element {
		let ref = React.useRef(null);
		return <>
			<div ref={ref} styleName="wrap">
				{
					user_state.login ? <div styleName="icon">🔔</div> : null
				}
				<div styleName="icon"> ☰ </div>
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
