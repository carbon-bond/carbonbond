import * as React from 'react';
import { Link } from 'react-router-dom';

import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { Board, BoardType } from '../ts/api/api_trait';
import { SimpleLocation, LocationState } from './global_state/location';

import style from '../css/board_list.module.css';
import '../css/layout.css';
import { getBoardInfo } from './board';

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

function BoardList(): JSX.Element {
	let [board_list, setBoardList] = React.useState<Board[]>([]);
	const { setCurrentLocation } = LocationState.useContainer();
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list);
		});
	}, []);

	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('所有看板'));
	}, [setCurrentLocation]);

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