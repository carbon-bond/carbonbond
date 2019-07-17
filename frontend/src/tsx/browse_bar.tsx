import * as React from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import '../css/browsebar.css';
import { getGraphQLClient } from './api';

type Board = { boardName: string, comment: string };

async function fetchHotBoards(): Promise<Board[]> {
	let client = getGraphQLClient();
	const mutation = `
			{
				boardList { boardName }
			}
		`;
	let res: { boardList: Board[] } = await  client.request(mutation);
	return res.boardList;
}

export function BrowseBar(): JSX.Element {
	let [fetching, setFetching] = React.useState(true);
	let [hot_boards, setHotBoards] = React.useState<Board[]>([]);
	let [expand, setExpand] = React.useState([true, true, true]);

	React.useEffect(() => {
		fetchHotBoards().then(boards => {
			setHotBoards(boards);
			setFetching(false);
		}).catch((err => {
			toast.error(err.message.split(':')[0]);
			setFetching(false);
		}));
	}, []);

	function onTitleClick(index: number): void {
		let new_expand = [...expand];
		new_expand[index] = !new_expand[index];
		setExpand(new_expand);
	}
	function genGridTemplate(): string {
		let g1 = expand[0] ? '25px 60px' : '25px 0px';
		let g2 = expand[1] ? '25px 1fr' : '25px 0fr';
		let g3 = expand[2] ? '25px 1fr' : '25px 0fr';
		return `${g1} ${g2} ${g3}`;
	}

	if (fetching) {
		return <div/>;
	} else {
		return <div styleName='browseBar' style={{ gridTemplateRows: genGridTemplate() }}>
			<ShrinkableBlock title='特化瀏覽' expand={expand[0]} onClick={() => onTitleClick(0)}>
				<div>
					<div>我的首頁</div>
					<div>熱門文章</div>
					<div>所有看板</div>
				</div>
			</ShrinkableBlock>
			<ShrinkableBlock title='熱門看板' expand={expand[1]} onClick={() => onTitleClick(1)}>
				{
					hot_boards.map(board => <BoardBlock board={board}/>)
				}
			</ShrinkableBlock>
			<ShrinkableBlock title='我的最愛' expand={expand[2]} onClick={() => onTitleClick(2)}>
				<div>我的首頁</div>
				<div>熱門文章</div>
				<div>所有看板</div>
			</ShrinkableBlock>
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
