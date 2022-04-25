import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBrowserHistory } from 'history';

import { BoardEditor } from './board_creator';
import { Board, BoardType } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { UserState } from '../global_state/user';

import '../../css/layout.css';
import style from '../../css/board/board_page.module.css';
import { BoardBody } from './board_page';
import { KeepAlive } from 'react-activation';

function BoardHeader(props: { board: Board}): JSX.Element {
	const { user_state } = UserState.useContainer();
	let [subscribe_count, setSubscribeCount] = React.useState<number>(0);
	let [editable, setEditable] = React.useState<boolean>(false);
	React.useEffect(() => {
		API_FETCHER.boardQuery.querySubscribedUserCount(props.board.id)
		.then(count => {
			setSubscribeCount(unwrap(count));
		});
		if (user_state.login) {
			if (props.board.board_type == BoardType.Personal && props.board.board_name == user_state.user_name) {
				setEditable(true);
			} else if (props.board.board_type == BoardType.General) {
				API_FETCHER.boardQuery.queryEditableForMe(props.board.id)
				.then(response => {
					setEditable(unwrap(response));
				});
			}
		}
		// @ts-ignore
	}, [props.board.board_name, props.board.board_type, props.board.id, user_state.login, user_state.user_name]);
	return <div className="boardHeader">
		<div className={style.boardHeader}>
			<div>
				<div className={style.headerLeft}>
					<div className={style.boardTitle}>
						<Link to="#">{props.board.board_name}</Link>
						{editable ? <span className={style.editButton}><button>編輯看板</button></span> : <></>}
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
								<div className={style.text}>本日文章數</div>
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
	if (user_state.login &&
		board_info.type == BoardType.Personal &&
		board_info.name == user_state.user_name) {
		return <div className={style.emptyBoard}>
			<div>查無此看板</div>
			<button onClick={() => handleClick()}>🔨 創建個人看板</button>
			<BoardEditor board_type={BoardType.Personal} party_id={-1} visible={expand} setVisible={setExpand} />
		</div>;
	} else if (board_info.type == BoardType.Personal) {
		return <div className={style.emptyBoard}>
			<div>{board_info.name} 尚未創建個版</div>
		</div>;
	} else {
		return <div className={style.emptyBoard}>
			<div>查無此看板</div>
		</div>;
	}
}

export class BoardInfo {
	name: string;
	type: BoardType;
	constructor(name: string, type: BoardType) {
		this.name = name;
		this.type = type;
	}
	to_url(): string {
		return `/app/b/${this.type.toLowerCase()}/${this.name}`;
	}
}

export function getBoardInfo(data: { board_name: string, board_type: BoardType }): BoardInfo {
	return new BoardInfo(data.board_name, data.board_type);
}

export function useBoardInfo(): BoardInfo {
	function toBoardType(str: string): BoardType {
		if (str == 'personal') {
			return BoardType.Personal;
		} else if (str == 'general') {
			return BoardType.General;
		}
		throw new Error(`未知的看板類型：${str}`);
	}
	let params = useParams();
	return new BoardInfo(params.board_name!, toBoardType(params.board_type!));
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
