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

	React.useEffect(() => {
		fetchHotBoards().then(boards => {
			setHotBoards(boards);
			setFetching(false);
		}).catch((err => {
			toast.error(err.message.split(':')[0]);
			setFetching(false);
		}));
	}, []);

	if (fetching) {
		return <div />;
	} else {
		return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			<ShrinkableBlock title='特化瀏覽' expand={true}>
				<div>我的首頁</div>
				<div>熱門文章</div>
				<div>所有看板</div>
			</ShrinkableBlock>
			<div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
				<ShrinkableBlock title='熱門看板' expand={true} flex={true}>
					{
						hot_boards.map(board => <BoardBlock board={board} />)
					}
				</ShrinkableBlock>
				<ShrinkableBlock title='我的最愛' expand={true} flex={true}>
					<div>我的首頁</div>
					<div>熱門文章</div>
					<div>所有看板</div>
				</ShrinkableBlock>
			</div>
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

function ShrinkableBlock(props: { children: React.ReactNode, title: string, expand: boolean, flex?: boolean }): JSX.Element {
	let [expand, setExpand] = React.useState(props.expand);
	return <>
		<div styleName='title' onClick={() => setExpand(!expand)}>
			{props.title}{expand ? ' ▼' : ' ▸'}
		</div>
		{
			((() => {
				if (props.flex) {
					return (
						<div styleName='shrinkableFlexBlock'
							style={{
								overflowY: expand ? 'scroll' : 'hidden',
								flex: expand ? 1 : 0,
								visibility: expand ? 'visible' : 'hidden',
							}}
						>
							{props.children}
						</div>
					);
				} else {
					return (
						<div styleName='shrinkableBlock'
							style={{
								overflowY: expand ? 'auto' : 'hidden',
								maxHeight: expand ? '30%' : 0,
								visibility: expand ? 'visible' : 'hidden'
							}}
						>
							{props.children}
						</div>
					);
				}
			}))()
		}

	</>;
}