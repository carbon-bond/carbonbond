import * as React from 'react';
import { Link } from 'react-router-dom';

import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { Board, BoardType } from '../ts/api/api_trait';

import '../css/board_list.css';
import '../css/layout.css?global';

async function fetchBoardList(): Promise<Board[]> {
	return unwrap_or(await API_FETCHER.queryBoardList(10), []);
}

function BoardBlock(props: { board: { board_name: string, board_type: string, title: string } }): JSX.Element {
	const name = props.board.board_name;
	const type = props.board.board_type;
	const title = props.board.title;
	return <Link to={`/app/${type === BoardType.General ? 'b' : 'user_board'}/${name}`}>
		<div>
			<div className="name">{name}</div>
			<div className="title">{title}</div>
		</div>
	</Link>;
}

function BoardList(): JSX.Element {
	let [board_list, setBoardList] = React.useState<Board[]>([]);
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list);
		});
	}, []);

	return <div className="boardList">
		<div className="mainContent">
			{
				board_list.map(board => (
					<div className="boardBlock" key={board.id}>
						<BoardBlock board={board}></BoardBlock>
					</div>
				))
			}
		</div>
	</div>;
}

export { BoardList };