import * as React from 'react';
import { Link, useParams } from 'react-router-dom';

import { BoardCreator } from './board_creator';
import { SwitchContent } from './switch_content';
import { Board, BoardType } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { UserState } from '../global_state/user';

import '../../css/layout.css';
import style from '../../css/board_switch/board_page.module.css';

type RenderHeader = { render_header: (board: Board, url: string, subscribe_count: number) => JSX.Element };

function BoardSwitch(props: { board_name: string, board_type: BoardType, hide_sidebar?: boolean } & RenderHeader): JSX.Element {
	let board_name = props.board_name;
	let board_type = props.board_type;
	let [fetching, setFetching] = React.useState(true);
	let [board, setBoard] = React.useState<Board | null>(null);
	let [subscribe_count, setSubscribeCount] = React.useState(0);
	let hide_sidebar = props.hide_sidebar;
	React.useEffect(() => {
		setBoard(null); // 注意：這裡會導致切看板時畫面閃動，但如果拿掉它，就要留意看板頁「以為自己在前一個的看板」之問題
		setFetching(true);
		API_FETCHER.boardQuery.queryBoard(board_name, board_type).then(res => {
			try {
				let board = unwrap(res);
				setBoard(board);
				return API_FETCHER.boardQuery.querySubscribedUserCount(board.id);
			} catch (err) {
				return Promise.reject(err);
			}
		}).then(res => {
			setSubscribeCount(unwrap(res));
		}).catch(err => {
			console.error(err);
		}).finally(() => {
			setFetching(false);
		});
	}, [board_name, board_type]);
	if (fetching) {
		return <></>;
	} else if (board == null) {
		return <EmptyBoard board_name={props.board_name} board_type={props.board_type} />;
	} else {
		return <BoardBody board={board} hide_sidebar={hide_sidebar} subscribe_count={subscribe_count} board_type={props.board_type} render_header={props.render_header} />;
	}
}

export function BoardHeader(props: { board: Board, url: string, subscribe_count: number }): JSX.Element {
	return <div className="boardSwitchHeader">
		<div className={style.boardHeader}>
			<div>
				<div className={style.headerLeft}>
					<div className={style.boardTitle}>
						<Link to={props.url}>{props.board.board_name}</Link>
					</div>
					<div className={style.boardSubTitle}>{props.board.title}</div>
				</div>

				<div className={style.headerRight}>
					{
						props.board == null ? null : <div className={style.dataBox}>
							<div className={style.dataBoxItem}>
								<div className={style.number}>{props.subscribe_count}</div>
								<div className={style.text}>訂閱人數</div>
							</div>
							<div className={style.dataBoxItem}>
								<div className={style.number}>{props.board.popularity}</div>
								<div className={style.text}>在線人數</div>
							</div>
						</div>
					}
				</div>
			</div>
		</div>
	</div>;
}

function BoardBody(props: { board: Board | null, hide_sidebar?: boolean, board_type: BoardType, subscribe_count: number } & RenderHeader): JSX.Element {
	const cur_board_type = props.board_type === BoardType.General ? 'b' : 'user_board';
	if (!props.board) {
		return <></>;
	}
	return <div className="forumBody">
		{
			props.render_header(props.board, `/app/${cur_board_type}/${props.board.board_name}`, props.subscribe_count)
		}
		<SwitchContent {...props} board={props.board} />
	</div>;
}

export function PersonalBoard(props: { hide_sidebar?: boolean} & RenderHeader): JSX.Element {
	let params = useParams();
	return <BoardSwitch board_name={params.profile_name!}
		board_type={BoardType.Personal} hide_sidebar={props.hide_sidebar}
		render_header={props.render_header} />;
}

export function GeneralBoard(props: { hide_sidebar?: boolean } & RenderHeader): JSX.Element {
	let params = useParams();
	return <BoardSwitch board_name={params.board_name!}
		board_type={BoardType.General} hide_sidebar={props.hide_sidebar}
		render_header={props.render_header} />;
}

export function EmptyBoard(props: { board_name: string, board_type: string }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [expand, setExpand] = React.useState<boolean>(false);

	function handleClick(): void {
		setExpand(!expand);
	}

	return <div>
		<div>查無此看板</div>
		{
			(user_state.login &&
				props.board_type == BoardType.Personal &&
				props.board_name == user_state.user_name) ?
				<button onClick={() => handleClick()}>🔨 創建個人看板</button>
				: <></>
		}
		<BoardCreator board_type={BoardType.Personal} party_id={-1} visible={expand} setVisible={setExpand} />
	</div>;
}