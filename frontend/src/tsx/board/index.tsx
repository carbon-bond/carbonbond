import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBrowserHistory } from 'history';

import { BoardCreator } from './board_creator';
import { Board, BoardType } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { UserState } from '../global_state/user';

import '../../css/layout.css';
import style from '../../css/board/board_page.module.css';
import { BoardBody } from './board_page';
import { KeepAlive } from 'react-activation';

function BoardHeader(props: { board: Board}): JSX.Element {
	let [subscribe_count, setSubscribeCount] = React.useState(0);
	API_FETCHER.boardQuery.querySubscribedUserCount(props.board.id)
	.then(count => {
		setSubscribeCount(unwrap(count));
	});
	return <div className="boardHeader">
		<div className={style.boardHeader}>
			<div>
				<div className={style.headerLeft}>
					<div className={style.boardTitle}>
						<Link to="#">{props.board.board_name}</Link>
					</div>
					<div className={style.boardSubTitle}>{props.board.title}</div>
				</div>

				<div className={style.headerRight}>
					{
						props.board == null ? null : <div className={style.dataBox}>
							<div className={style.dataBoxItem}>
								<div className={style.number}>{subscribe_count}</div>
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

function BoardPage(props: { board: Board | null}): JSX.Element {
	if (!props.board) {
		return <></>;
	}
	return <div className="forumBody">
		<BoardHeader board={props.board} />
		<BoardBody {...props} board={props.board} />
	</div>;
}

export function EmptyBoard(): JSX.Element {
	const { user_state } = UserState.useContainer();
	let board_info = useBoardInfo();
	const [expand, setExpand] = React.useState<boolean>(false);

	function handleClick(): void {
		setExpand(!expand);
	}

	return <div className="content">
		<div>查無此看板</div>
		{
			(user_state.login &&
				board_info.type == BoardType.Personal &&
				board_info.name == user_state.user_name) ?
				<button onClick={() => handleClick()}>🔨 創建個人看板</button>
				: <></>
		}
		<BoardCreator board_type={BoardType.Personal} party_id={-1} visible={expand} setVisible={setExpand} />
	</div>;
}

export type BoardInfo = {
	name: string,
	type: BoardType
};

export function getBoardInfo(data: { board_name: string, board_type: string }): BoardInfo {
	return {
		name: data.board_name,
		type: toBoardType(data.board_type),
	};
}

export function board_info_to_url(info: BoardInfo): string {
	let type = info.type == BoardType.General ? 'general' : 'personal';
	return `/app/b/${type}/${info.name}`;
}

function toBoardType(str: string): BoardType {
	if (str == 'personal' || str == 'Personal') {
		return BoardType.Personal;
	} else if (str == 'general' || str == 'General') {
		return BoardType.General;
	}
	throw new Error(`未知的看板類型：${str}`);
}

export function useBoardInfo(): BoardInfo {
	let params = useParams();
	return {
		name: params.board_name!,
		type: toBoardType(params.board_type!)
	};
}

export function KeepAliveBoardPage(): JSX.Element {
	let history = createBrowserHistory();
	return <KeepAlive name={history.location.key} id={history.location.key}>
		<BoardPageWrap />
	</KeepAlive>;
}

function BoardPageWrap(): JSX.Element {
	let info = useBoardInfo();
	let [fetching, setFetching] = React.useState(true);
	let [board, setBoard] = React.useState<Board | null>(null);
	React.useEffect(() => {
		setBoard(null); // 注意：這裡會導致切看板時畫面閃動，但如果拿掉它，就要留意看板頁「以為自己在前一個的看板」之問題
		setFetching(true);
		API_FETCHER.boardQuery.queryBoard(info.name, info.type).then(res => {
			try {
				let board = unwrap(res);
				setBoard(board);
			} catch (err) {
				return Promise.reject(err);
			}
		}).catch(err => {
			console.error(err);
		}).finally(() => {
			setFetching(false);
		});
	}, [info.name, info.type]);
	if (fetching) {
		return <></>;
	} else if (board == null) {
		return <EmptyBoard />;
	} else {
		return <BoardPage board={board} />;
	}
}
