import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';
import { Board, Party } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';

import style from '../../css/board_switch/right_sidebar.module.css';
import { toastErr, useSubscribeBoard } from '../utils';

type Props = RouteComponentProps<{ board_name: string }> & {
	board: Board
};

export function BoardSidebar(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [ parties, setParties ] = React.useState(new Array<Party>());
	const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	let { has_subscribed, toggleSubscribe } = useSubscribeBoard(props.board);

	React.useEffect(() => {
		API_FETCHER.partyQuery.queryBoardPartyList(props.board.id).then(res => {
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
				anonymous: false,
				category: '',
				title: '',
				content: {},
			});
			openEditorPanel();
		}
	}

	function SubscribeButton(): JSX.Element {
		if (has_subscribed) {
			return <div onClick={() => toggleSubscribe()} className={`${style.subscribeButton} ${style.rightSidebarButton}`}>
				<b>😭 </b>取消訂閱
			</div>;
		} else {
			return <div onClick={() => toggleSubscribe()} className={`${style.subscribeButton} ${style.rightSidebarButton}`}>
				<b>🔖 </b>訂閱看板
			</div>;
		}
	}

	return <>
		{
			user_state.login &&
			<div className={style.rightSidebarItem}>
				<div onClick={() => onEditClick()} className={`${style.postArticleButton} ${style.rightSidebarButton}`}><b>🖉 </b>發表文章</div>
				<SubscribeButton />
			</div>
		}
		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.header}>看板簡介</div>
				<div className={style.content}>
					{props.board.detail}
				</div>
				{/* <div className={style.rightSidebarButton trackBoardButton}>訂閱此看板</div> */}
			</div>
		</div>

		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.header}>政黨列表</div>
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
		<div className={style.content}>
			<div className={`${style.partyItem} ${style.mainPartyItem}`}>
				<div className={style.partyTitle}>執政黨</div>
				<div className={style.partyName}>{ruling!.party_name}</div>
				<div className={style.partyScore}> {ruling!.energy} <i> ☘ </i></div>
			</div>
			{
				oppositions.map((p, idx) => {
					return <div key={p.id} className={style.partyItem}>
						<div className={style.partyTitle}>
							{idx == 0 ? '在野黨' : ''}
						</div>
						<div className={style.partyName}>{p.party_name}</div>
						<div className={style.partyScore}>{p.energy}<i> ☘ </i></div>
					</div>;
				})
			}
		</div>
		<div className={`${style.rightSidebarButton} ${style.showPartyButton}`}>顯示更多政黨</div>
	</>;
}

export function ArticleSidebar(): JSX.Element {
	return <>
		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}> 關於作者 </div>
		</div>

		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}> 廣告 </div>
		</div>
	</>;
}