import * as React from 'react';
import { Link } from 'react-router-dom';

import { getGraphQLClient } from './api';

type Board = {
	id: string,
	boardName: string,
	rulingPartyId: string
};

type BoardList = {
	boardList: Board[]
};

function fetchBoardList(): Promise<BoardList> {
	const graphQLClient = getGraphQLClient();
	const query = `
		query {
			boardList {
				id
				boardName
				rulingPartyId
			}
		}
	`;
	return graphQLClient.request(query);
}

function MainContent(): JSX.Element {
	let [board_list, setBoardList] = React.useState<Board[]>([]);
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list.boardList);
		});
	}, []);

	return (
		<div>
			<h1>金剛、石墨，參見！</h1>
			{
				board_list.map(board => (
					<Link key={board.id} to={`/app/b/${board.boardName}`}>
						<p>{board.boardName}</p>
					</Link>
				))
			}
		</div>
	);
}

export { MainContent };