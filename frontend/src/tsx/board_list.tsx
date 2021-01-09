import * as React from 'react';
import { Link } from 'react-router-dom';

import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { Board } from '../ts/api/api_trait';

import '../css/board_list.css';
import '../css/layout.css?global';

async function fetchBoardList(): Promise<Board[]> {
	return unwrap_or(await API_FETCHER.queryBoardList(10), []);
}

function BoardBlock(props: { board: { board_name: string, title: string }}): JSX.Element {
	const name = props.board.board_name;
	const title = props.board.title;
	return <Link to={`/app/b/${name}`}>
		<div>
			<div styleName="name">{name}</div>
			<div styleName="title">{title}</div>
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

	return <div styleName="boardList">
		<div className="mainContent">
			{
				board_list.map(board => (
					<div styleName="boardBlock" key={board.id}>
						<BoardBlock board={board}></BoardBlock>
					</div>
				))
			}
		</div>
	</div>;
}

export { BoardList };