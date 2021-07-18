import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';
import { Board, Party } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';

import '../../css/board_switch/right_sidebar.css';
import { toastErr, useSubscribeBoard } from '../utils';

type Props = RouteComponentProps<{ board_name: string }> & {
	board: Board
};

export function BoardSidebar(props: Props): JSX.Element {
	let [ parties, setParties ] = React.useState(new Array<Party>());
	let { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	let { has_subscribed, toggleSubscribe } = useSubscribeBoard(props.board);

	React.useEffect(() => {
		API_FETCHER.queryBoardPartyList(props.board.id).then(res => {
			setParties(unwrap(res));
		}).catch(err => toastErr(err));
	}, [props.board.id]);

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
			return <div onClick={() => toggleSubscribe()} className="subscribeButton rightSidebarButton">
				<b>😭 </b>取消訂閱
			</div>;
		} else {
			return <div onClick={() => toggleSubscribe()} className="subscribeButton rightSidebarButton">
				<b>🔖 </b>訂閱看板
			</div>;
		}
	}

	return <>
		{
			user_state.login &&
			<div className="rightSidebarItem">
				<div onClick={() => onEditClick()} className="postArticleButton rightSidebarButton"><b>🖉 </b>發表文章</div>
				<SubscribeButton />
			</div>
		}
		<div className="rightSidebarItem">
			<div className="rightSidebarBlock">
				<div className="header">看板簡介</div>
				<div className="content">
					{props.board.detail}
				</div>
				{/* <div className="rightSidebarButton trackBoardButton">訂閱此看板</div> */}
			</div>
		</div>

		<div className="rightSidebarItem">
			<div className="rightSidebarBlock">
				<div className="header">政黨列表</div>
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
		<div className="content">
			<div className="partyItem mainPartyItem">
				<div className="partyTitle">執政黨</div>
				<div className="partyName">{ruling!.party_name}</div>
				<div className="partyScore"> {ruling!.energy} <i> ☘ </i></div>
			</div>
			{
				oppositions.map((p, idx) => {
					return <div key={p.id} className="partyItem">
						<div className="partyTitle">
							{idx == 0 ? '在野黨' : ''}
						</div>
						<div className="partyName">{p.party_name}</div>
						<div className="partyScore">{p.energy}<i> ☘ </i></div>
					</div>;
				})
			}
		</div>
		<div className="rightSidebarButton showPartyButton">顯示更多政黨</div>
	</>;
}

export function ArticleSidebar(): JSX.Element {
	return <>
		<div className="rightSidebarItem">
			<div className="rightSidebarBlock"> 關於作者 </div>
		</div>

		<div className="rightSidebarItem">
			<div className="rightSidebarBlock"> 廣告 </div>
		</div>
	</>;
}