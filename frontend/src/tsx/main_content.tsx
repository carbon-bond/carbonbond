import * as React from 'react';
import { Link } from 'react-router-dom';

import { ajaxOperation, GQL } from '../ts/api';

type Board = GQL.BoardMetaFragment;

async function fetchBoardList(): Promise<Board[]> {
	let res = await ajaxOperation.BoardList();
	return res.boardList;
}

function MainContent(): JSX.Element {
	let [board_list, setBoardList] = React.useState<Board[]>([]);
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list);
		});
	}, []);

	return (
		<>
			<div className="content">
				<h1>金剛、石墨，參見！</h1>
				{
					board_list.map(board => (
						<Link key={board.id} to={`/app/b/${board.boardName}`}>
							<p>{board.boardName}</p>
						</Link>
					))
				}
			</div>
			<div className="rightSideBar">
				右邊欄
			</div>
		</>
	);
}

export { MainContent };