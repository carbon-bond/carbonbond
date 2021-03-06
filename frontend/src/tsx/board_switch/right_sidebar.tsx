import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';
import { Board, Party } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';

import '../../css/board_switch/right_sidebar.css';
import { SubscribedBoardsState } from '../global_state/subscribed_boards';
import { toastErr } from '../utils';

type Props = RouteComponentProps<{ board_name: string }> & {
	board: Board
};

export function BoardSidebar(props: Props): JSX.Element {
	let [ parties, setParties ] = React.useState(new Array<Party>());
	let { user_state } = UserState.useContainer();
	let { subscribed_boards, subscribe, unsubscribe } = SubscribedBoardsState.useContainer();
	const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	let has_subscribed = subscribed_boards.has(props.board.id);

	React.useEffect(() => {
		API_FETCHER.queryBoardPartyList(props.board.id).then(res => {
			setParties(unwrap(res));
		}).catch(err => toastErr(err));
	});

	async function onUnsubscribeBoardClick(): Promise<void> {
		console.log('按下取消追蹤看板');
		try {
			unwrap(await API_FETCHER.unsubscribeBoard(props.board.id));
			unsubscribe(props.board.id);
		} catch (err) {
			toastErr(err);
		}
	}
	async function onSubscribeBoardClick(): Promise<void> {
		console.log('按下追蹤看板');
		try {
			unwrap(await API_FETCHER.subscribeBoard(props.board.id));
			let b = props.board;
			subscribe({
				id: b.id,
				board_name: b.board_name,
				title: b.title,
				popularity: 0
			});
		} catch (err) {
			toastErr(err);
		}
	}
	function onEditClick(): void {
		console.log('press post');
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			setEditorPanelData({
				board: props.board,
				category: '',
				title: '',
				content: {},
			});
			openEditorPanel();
		}
	}

	function SubscribeButton(): JSX.Element {
		if (has_subscribed) {
			return <div onClick={() => onUnsubscribeBoardClick()} styleName="subscribeButton rightSidebarButton">
				<b>😭 </b>取消追蹤
			</div>;
		} else {
			return <div onClick={() => onSubscribeBoardClick()} styleName="subscribeButton rightSidebarButton">
				<b>🔖 </b>追蹤看板
			</div>;
		}
	}

	return <>
		{
			user_state.login &&
			<div styleName="rightSidebarItem">
				<div onClick={() => onEditClick()} styleName="postArticleButton rightSidebarButton"><b>🖉 </b>發表文章</div>
				<SubscribeButton />
			</div>
		}
		<div styleName="rightSidebarItem">
			<div styleName="rightSidebarBlock">
				<div styleName="header">看板簡介</div>
				<div styleName="content">
					{props.board.detail}
				</div>
				{/* <div styleName="rightSidebarButton trackBoardButton">追蹤此看板</div> */}
			</div>
		</div>

		<div styleName="rightSidebarItem">
			<div styleName="rightSidebarBlock">
				<div styleName="header">政黨列表</div>
				<PartyList parties={parties}/>
			</div>
		</div>
	</>;
}

function PartyList(props: {parties: Party[]}): JSX.Element {
	let oppositions = new Array<Party>();
	let ruling: Party | null = null;
	if (props.parties.length == 0) {
		return <></>;
	}
	for (const p of props.parties) {
		if (p.ruling) {
			ruling = p;
		} else {
			oppositions.push(p);
		}
	}
	return <>
		<div styleName="content">
			<div styleName="partyItem mainPartyItem">
				<div styleName="partyTitle">執政黨</div>
				<div styleName="partyName">{ruling!.party_name}</div>
				<div styleName="partyScore"> {ruling!.energy} <i> ☘ </i></div>
			</div>
			{
				oppositions.map((p, idx) => {
					return <div key={p.id} styleName="partyItem">
						<div styleName="partyTitle">
							{idx == 0 ? '在野黨' : ''}
						</div>
						<div styleName="partyName">{p.party_name}</div>
						<div styleName="partyScore">{p.energy}<i> ☘ </i></div>
					</div>;
				})
			}
		</div>
		<div styleName="rightSidebarButton showPartyButton">顯示更多政黨</div>
	</>;
}

export function ArticleSidebar(): JSX.Element {
	return <>
		<div styleName="rightSidebarItem">
			<div styleName="rightSidebarBlock"> 關於作者 </div>
		</div>

		<div styleName="rightSidebarItem">
			<div styleName="rightSidebarBlock"> 廣告 </div>
		</div>
	</>;
}