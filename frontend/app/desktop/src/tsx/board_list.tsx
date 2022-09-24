import * as React from 'react';
import { Link } from 'react-router-dom';

import { API_FETCHER, unwrap_or } from 'carbonbond-api/api_utils';
import { Board, BoardType } from 'carbonbond-api/api_trait';
import { SimpleLocation, LocationState } from './global_state/location';

import style from '../css/board_list.module.css';
import '../css/layout.css';
import { getBoardInfo } from './board';
import { SubscribedBoardsState } from './global_state/subscribed_boards';
import { BoardOverview } from 'carbonbond-api/api_trait';
import { TabPanelWithLink, TabPanelWithLinkItem } from './components/tab_panel';

async function fetchBoardList(): Promise<Board[]> {
	return unwrap_or(await API_FETCHER.boardQuery.queryBoardList(10), []);
}

function BoardBlock(props: { board: Board }): JSX.Element {
	const name = props.board.board_name;
	const board_info = getBoardInfo(props.board);
	const title = props.board.title;
	const is_personal_board = props.board.board_type == BoardType.Personal;
	return <Link to={board_info.to_url()}>
		<div>
			<div className={style.info}>
				<div className={style.name}>{name}</div>
				<div className={style.type}>{is_personal_board ? '(個版)' : ''}</div>
			</div>
			<div className={style.title}>{title}</div>
		</div>
	</Link>;
}

async function fetchHotBoards(): Promise<BoardOverview[]> {
	let boards = unwrap_or(await API_FETCHER.boardQuery.queryHotBoards(), []);
	boards.sort((b1, b2) => b2.popularity - b1.popularity);
	return boards;
}

function AllBoardList(props: {boards: Board[]}): JSX.Element {
	return <div className={style.boardList}>
		<div className="mainContent">
			{
				props.boards.map(board => (
					<div className={style.boardBlock} key={`all-${board.id}`}>
						<BoardBlock board={board}></BoardBlock>
					</div>
				))
			}
		</div>
	</div>;
}

function HotBoardListElement(props: {boards: Board[], hot_boards: BoardOverview[]}): JSX.Element {
	const hot_board_ids = props.hot_boards.reduce((accu, curr) => {
		accu.add(curr.id);
		return accu;
	}, new Set());
	const boards = props.boards.filter(board => hot_board_ids.has(board.id));
	return <div className={style.boardList}>
		<div className="mainContent">
			{
				boards.map(board => (
					<div className={style.boardBlock} key={`hot-${board.id}`}>
						<BoardBlock board={board}></BoardBlock>
					</div>
				))
			}
		</div>
	</div>;
}

type SubscribedBoards = {[key: number]: BoardOverview};

function SubscribeBoardListElement(props: {boards: Board[], subscribe_boards: SubscribedBoards}): JSX.Element {
	const subscribe_board_ids = Object.entries(props.subscribe_boards).reduce((accu, [_i, board]) => {
		accu.add(board.id);
		return accu;
	}, new Set());
	const boards = props.boards.filter(board => subscribe_board_ids.has(board.id));
	return <div className={style.boardList}>
		<div className="mainContent">
			{
				boards.map(board => (
					<div className={style.boardBlock} key={`subscribe-${board.id}`}>
						<BoardBlock board={board}></BoardBlock>
					</div>
				))
			}
		</div>
	</div>;
}

function BoardList(): JSX.Element {
	const { setCurrentLocation } = LocationState.useContainer();
	let [all_boards, setAllBoards] = React.useState<Board[]>([]);

	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setAllBoards(board_list);
		});
	}, []);

	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('所有看板'));
	}, [setCurrentLocation]);

	return <TabPanelWithLink select_tab={2}>
		<TabPanelWithLinkItem is_disable={false} title="訂閱看板"
			link="/app/subscribe_board_list"
			element={<></>}/>
		<TabPanelWithLinkItem is_disable={false} title="熱門看板"
			link="/app/hot_board_list"
			element={<></>}/>
		<TabPanelWithLinkItem is_disable={false} title="所有看板"
			link="/app/board_list"
			element={<AllBoardList boards={all_boards}/>} />
	</TabPanelWithLink>;
}

function HotBoardList(): JSX.Element {
	const { setCurrentLocation } = LocationState.useContainer();
	let [hot_boards, setHotBoards] = React.useState<BoardOverview[]>([]);
	let [all_boards, setAllBoards] = React.useState<Board[]>([]);

	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setAllBoards(board_list);
		});
	}, []);

	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('熱門看板'));
	}, [setCurrentLocation]);

	React.useEffect(() => {
		if (window.is_mobile) {
			fetchHotBoards().then(boards => {
				setHotBoards(boards);
			});
		}
	}, []);

	return <TabPanelWithLink select_tab={1}>
		<TabPanelWithLinkItem is_disable={false} title="訂閱看板"
			link="/app/subscribe_board_list"
			element={<></>}/>
		<TabPanelWithLinkItem is_disable={false} title="熱門看板"
			link="/app/hot_board_list"
			element={<HotBoardListElement boards={all_boards} hot_boards={hot_boards}/>} />
		<TabPanelWithLinkItem is_disable={false} title="所有看板"
			link="/app/board_list"
			element={<></>}/>
	</TabPanelWithLink>;
}

function SubscribeBoardList(): JSX.Element {
	let { subscribed_boards } = SubscribedBoardsState.useContainer();
	const { setCurrentLocation } = LocationState.useContainer();
	let [all_boards, setAllBoards] = React.useState<Board[]>([]);

	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setAllBoards(board_list);
		});
	}, []);

	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('訂閱看板'));
	}, [setCurrentLocation]);

	return <TabPanelWithLink select_tab={0}>
		<TabPanelWithLinkItem is_disable={false} title="訂閱看板"
			link="/app/subscribe_board_list"
			element={<SubscribeBoardListElement boards={all_boards} subscribe_boards={subscribed_boards}/>} />
		<TabPanelWithLinkItem is_disable={false} title="熱門看板"
			link="/app/hot_board_list"
			element={<></>}/>
		<TabPanelWithLinkItem is_disable={false} title="所有看板"
			link="/app/board_list"
			element={<></>}/>
	</TabPanelWithLink>;
}

export { BoardList, HotBoardList, SubscribeBoardList };