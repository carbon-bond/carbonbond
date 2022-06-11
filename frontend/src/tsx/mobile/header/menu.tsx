import * as React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import style from '../../../css/mobile/menu.module.css';
import { API_FETCHER, unwrap } from '../../../ts/api/api';
import type { BoardOverview, Result, Error } from '../../../ts/api/api_trait';
import { BoardBlock } from '../../left_panel/browse_bar';
import { UserState } from '../../global_state/user';
import { toastErr } from '../../utils';

type RowProps<T> = { children: T } & ({ to: string } | { onClick: () => void } | {});

export function Menu(props: {
	logining: boolean,
	setLogining: (boolean: boolean) => void,
	setExpandingMenu: (expanding: boolean) => void,
	userBlock: JSX.Element
}): JSX.Element {
	const { user_state, setLogout } = UserState.useContainer();

	function onCoverClicked(): void {
		if (!props.logining) {
			props.setExpandingMenu(false);
		}
	}
	function Row<T>(props: RowProps<T>): JSX.Element {
		if ('to' in props) {
			return <Link to={props.to} onClick={onCoverClicked}>
				<Row>{props.children}</Row>
			</Link>;
		}
		return <a className={style.row} onClick={() => {
			if ('onClick' in props) {
				props.onClick();
			}
		}}>
			<div className={style.space} />
			{props.children}
			<div className={style.space} />
		</a>;
	}
	function BoardsRow(props: { name: string, fetchBoards: () => Promise<Result<BoardOverview[], Error>> }): JSX.Element {
		let [boards, setBoards] = React.useState(new Array<BoardOverview>());
		let [expanding, setExpanding] = React.useState(false);

		async function onExpand(): Promise<void> {
			if (!expanding && boards.length == 0) {
				let res = await props.fetchBoards();
				try {
					setBoards(unwrap(res));
				} catch (err) {
					toastErr(err);
				}
			}
			setExpanding(!expanding);
		}

		if (!expanding) {
			return <Row onClick={onExpand}>{props.name} ▼ </Row>;
		} else {
			return <>
				<Row onClick={onExpand}>{props.name} ▲ </Row>
				{boards.map(board => {
					return <div onClick={onCoverClicked}><BoardBlock key={board.id} board={board}/></div>;
				})}
			</>;
		}
	}

	async function logout_request(): Promise<{}> {
		try {
			unwrap(await API_FETCHER.userQuery.logout());
			setLogout();
			toast('您已登出');
		} catch (err) {
			toastErr(err);
		}
		return {};
	}

	return <>
		<div className={style.wrap}>
        	<div className={style.cover} onClick={onCoverClicked} />
        	<div className={style.menu}>
        		{
        			!user_state.login ? null : <>
						<Row to={`/app/user/${user_state.user_name}`}>{props.userBlock}</Row>
						<Row onClick={logout_request}>登出</Row>
						<BoardsRow name="訂閱看板" fetchBoards={async () => await API_FETCHER.userQuery.querySubcribedBoards()} />
					</>
        		}
        		{
        			user_state.login ? null : <Row onClick={() => {props.setLogining(true); props.setExpandingMenu(false);}}>登入</Row>
        		}
        		<BoardsRow name="熱門看板" fetchBoards={async () => await API_FETCHER.boardQuery.queryHotBoards()} />
        		{
        			!user_state.login ? null : <>
						<Row to={`/app/b/personal/${user_state.user_name}`}>我的個板</Row>
					</>
        		}
        	</div>
		</div>
	</>;
}