import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from 'react-use';

import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { Board } from '../ts/api/api_trait';
import { LocationCacheState } from './global_state/location_cache';

import style from '../css/board_list.module.css';
import '../css/layout.css';
import { board_info_to_url, getBoardInfo } from './board';

async function fetchBoardList(): Promise<Board[]> {
	return unwrap_or(await API_FETCHER.boardQuery.queryBoardList(10), []);
}

function BoardBlock(props: { board: Board }): JSX.Element {
	const name = props.board.board_name;
	const board_info = getBoardInfo(props.board);
	const title = props.board.title;
	return <Link to={board_info_to_url(board_info)}>
		<div>
			<div className={style.name}>{name}</div>
			<div className={style.title}>{title}</div>
		</div>
	</Link>;
}

function BoardList(): JSX.Element {
	let [board_list, setBoardList] = React.useState<Board[]>([]);
	const { setCurrentLocation } = LocationCacheState.useContainer();
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list);
		});
	}, []);

	React.useEffect(() => {
		setCurrentLocation({name: '所有看板', is_article_page: false});
	}, [setCurrentLocation]);
	useTitle('所有看板');

	return <div className={style.boardList}>
		<div className="mainContent">
			{
				board_list.map(board => (
					<div className={style.boardBlock} key={board.id}>
						<BoardBlock board={board}></BoardBlock>
					</div>
				))
			}
		</div>
	</div>;
}

export { BoardList };