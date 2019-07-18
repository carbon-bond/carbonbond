import * as React from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import '../css/browsebar.css';
import { getGraphQLClient, extractErrMsg } from './api';
import { UserState } from './global_state';
import { STORAGE_NAME } from './constants';

type Board = { boardName: string, title: string };

async function fetchHotBoards(): Promise<Board[]> {
	let client = getGraphQLClient();
	const query = `
			{
				boardList { boardName, title }
			}
		`;
	let res: { boardList: Board[] } = await  client.request(query);
	return res.boardList;
}

// TODO: 應該用 context 記住熱門看板與追蹤看板，以免次切換測邊欄都要向後端發 request

export function BrowseBar(): JSX.Element {
	let { user_state } = UserState.useContainer();
	let default_expand = (() => {
		try {
			let exp = JSON.parse(localStorage[STORAGE_NAME.browsebar_expand]);
			return exp as [boolean, boolean, boolean];
		}
		catch {
			return [true, true, true];
		}
	})();
	let [fetching, setFetching] = React.useState(true);
	let [hot_boards, setHotBoards] = React.useState<Board[]>([]);
	let [expand, setExpand] = React.useState(default_expand);

	React.useEffect(() => {
		fetchHotBoards().then(boards => {
			setHotBoards(boards);
			setFetching(false);
		}).catch((err => {
			toast.error(extractErrMsg(err));
			setFetching(false);
		}));
	}, []);

	function onTitleClick(index: number): void {
		let new_expand = [...expand];
		new_expand[index] = !new_expand[index];
		setExpand(new_expand);
		localStorage[STORAGE_NAME.browsebar_expand] = JSON.stringify(new_expand);
	}
	function genGridTemplate(): string {
		let g1 = expand[0] ? '25px 60px' : '25px 0px';
		let g2 = expand[1] ? '25px 1fr' : '25px 0fr';
		let g3 = expand[2] ? '25px 1fr' : '25px 0fr';
		if (user_state.login) {
			return `${g1} ${g2} ${g3}`;
		} else {
			return `${g1} ${g2}`;
		}
	}

	if (fetching) {
		return <div/>;
	} else {
		return <div styleName='browseBar' style={{ gridTemplateRows: genGridTemplate() }}>
			<ShrinkableBlock
				title='特化瀏覽'
				expand={expand[0]}
				onClick={() => onTitleClick(0)}
			>
				<div>
					<div>我的首頁</div>
					<div>全站熱門</div>
					<div>所有看板</div>
				</div>
			</ShrinkableBlock>
			<ShrinkableBlock
				title='熱門看板'
				expand={expand[1]}
				onClick={() => onTitleClick(1)}
			>
				{
					hot_boards.map((board, i) => <BoardBlock key={i} board={board}/>)
				}
			</ShrinkableBlock>
			{
				(() => {
					if (user_state.login) {
						return <ShrinkableBlock
							title='追蹤看板'
							expand={expand[2]}
							onClick={() => onTitleClick(2)}
						>
							{
								hot_boards.map((board, i) => <BoardBlock key={i} board={board} />)
							}
						</ShrinkableBlock>;
					}
				})()
			}
		</div>;
	}
}

function BoardBlock(props: { board: Board }): JSX.Element {
	let board = props.board;
	return <Link to={`/app/b/${board.boardName}`}>
		<div styleName='boardBlock'>
			<div>
				<div styleName='boardName'>{board.boardName}</div>
				<div styleName='boardHeat'>🔥 0</div>
				<div styleName='boardTitle'>{board.title}</div>
			</div>
		</div>
	</Link>;
}

function ShrinkableBlock(props: {
	children: React.ReactNode,
	title: string,
	expand: boolean,
	onClick: () => void,
}): JSX.Element {
	return <>
		<div styleName='title' onClick={() => props.onClick()}>
			{props.title}{props.expand ? ' ▼' : ' ▸'}
		</div>
		<div style={{
			overflowY: props.expand ? 'auto' : 'hidden',
		}}>
			{props.children}
		</div>
	</>;
}
