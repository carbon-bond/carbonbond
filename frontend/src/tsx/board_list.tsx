import * as React from 'react';
import { Link } from 'react-router-dom';

import { ajaxOperation, GQL } from '../ts/api';

import '../css/board_list.css';

type Board = GQL.BoardMetaFragment;

async function fetchBoardList(): Promise<Board[]> {
	let res = await ajaxOperation.BoardList();
	return res.boardList;
}

function BoardBlock(props: { board: { boardName: string, title: string }}): JSX.Element {
	const name = props.board.boardName;
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
		<div>
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