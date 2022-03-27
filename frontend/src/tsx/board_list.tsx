import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from 'react-use';

import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { Board, BoardType } from '../ts/api/api_trait';
import { LocationCacheState } from './global_state/board_cache';

import style from '../css/board_list.module.css';
import '../css/layout.css';

async function fetchBoardList(): Promise<Board[]> {
	return unwrap_or(await API_FETCHER.boardQuery.queryBoardList(10), []);
}

function BoardBlock(props: { board: { board_name: string, board_type: string, title: string } }): JSX.Element {
	const name = props.board.board_name;
	const type = props.board.board_type;
	const title = props.board.title;
	return <Link to={`/app/${type === BoardType.General ? 'b' : 'user_board'}/${name}`}>
		<div>
			<div className={style.name}>{name}</div>
			<div className={style.title}>{title}</div>
		</div>
	</Link>;
}

function BoardList(): JSX.Element {
	let [board_list, setBoardList] = React.useState<Board[]>([]);
	const { setCurLocation } = LocationCacheState.useContainer();
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list);
		});
	}, []);

	React.useLayoutEffect(() => {
		setCurLocation({name: '所有看板', is_board: false});
	}, [setCurLocation]);
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