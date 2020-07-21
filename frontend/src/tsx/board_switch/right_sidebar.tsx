import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';
import { Board } from '../../ts/api/api_trait';

import '../../css/board_switch/right_sidebar.css';

type Props = RouteComponentProps<{ board_name: string }> & {
	board: Board
};

export function BoardSidebar(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();

	function onEditClick(): void {
		console.log('press post');
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			setEditorPanelData({
				board: props.board,
				category: '',
				title: '',
				content: [],
			});
			openEditorPanel();
		}
	}

	return <>

		{
			user_state.login &&
			<div styleName="rightSidebarItem">
				<div onClick={() => onEditClick()} styleName="postArticleButton rightSidebarButton">發表文章</div>
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
				<div styleName="content">
					<div styleName="partyItem mainPartyItem">
						<div styleName="partyTitle">執政黨</div>
						<div styleName="partyName">這裡是黨名</div>
						<div styleName="partyScore">8.7 萬<i> ☘ </i></div>
					</div>

					<div styleName="partyItem">
						<div styleName="partyTitle">在野黨</div>
						<div styleName="partyName">這裡是黨名</div>
						<div styleName="partyScore">2.2 萬<i> ☘ </i></div>
					</div>
					<div styleName="partyItem">
						<div styleName="partyTitle"></div>
						<div styleName="partyName">這裡是黨名</div>
						<div styleName="partyScore">1328<i> ☘ </i></div>
					</div>
				</div>
				<div styleName="rightSidebarButton showPartyButton">顯示更多政黨</div>
			</div>
		</div>
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