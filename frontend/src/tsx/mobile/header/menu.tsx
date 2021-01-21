import * as React from 'react';
import { Link } from 'react-router-dom';

import '../../../css/mobile/menu.css';
import { API_FETCHER, unwrap } from '../../../ts/api/api';
import { BoardOverview, Result, Error } from '../../../ts/api/api_trait';
import { BoardBlock } from '../../browsebar';
import { UserState } from '../../global_state/user';
import { toastErr } from '../../utils';

type RowProps<T> = { children: T } & ({ to: string } | { onClick: () => void } | {});

export function Menu(props: { onCoverClicked: () => void, userBlock: JSX.Element }): JSX.Element {
	let onCoverClicked = props.onCoverClicked;
	const { user_state } = UserState.useContainer();

	function Row<T>(props: RowProps<T>): JSX.Element {
		if ('to' in props) {
			return <Link to={props.to} onClick={onCoverClicked}>
				<Row>{props.children}</Row>
			</Link>;
		}
		return <div styleName="row" onClick={() => {
			if ('onClick' in props) {
				props.onClick();
			}
		}}>
			<div styleName="space" />
			{props.children}
			<div styleName="space" />
		</div>;
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

	return <>
        <div styleName="wrap">
        	<div styleName="cover" onClick={() => props.onCoverClicked()}/>
        	<div styleName="menu">
        		{
        			!user_state.login ? null : <>
                        <Row to={`/app/user/${user_state.user_name}`}>{props.userBlock}</Row>
						<BoardsRow name="訂閱看板" fetchBoards={async () => await API_FETCHER.querySubcribedBoards()} />
                    </>
        		}
        		<BoardsRow name="熱門看板" fetchBoards={async () => await API_FETCHER.queryHotBoards()} />
        		{
        			!user_state.login ? null : <>
                        <Row to={`/app/user_board/${user_state.user_name}`}>我的個板</Row>
                    </>
        		}
        	</div>
        </div>
    </>;
}