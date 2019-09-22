import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { EditorPanelState, UserState } from '../global_state';

import '../../css/board_page.css';

type Props = RouteComponentProps<{ board_name: string }>;


export function BoardSidebar(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel } = EditorPanelState.useContainer();
	let board_name = props.match.params.board_name;

	function onEditClick(): void {
		console.log('press post');
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			openEditorPanel({ board_name });
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
					這是一個看板內容的簡介，這是一個看板內容的簡介，這是一個看板內容的簡介，這是一個看板內容的簡介
				</div>
				<div styleName="rightSidebarButton trackBoardButton">追蹤此看板</div>
			</div>
		</div>

		<div styleName="rightSidebarItem">
			<div styleName="rightSidebarBlock">
				<div styleName="header">政黨列表</div>
				<div styleName="content">
					<div styleName="partyItem mainPartyItem">
						<div styleName="partyTitle">執政黨</div>
						<div styleName="partyName">這裡是黨名</div>
						<div styleName="partyScore">8.7 萬<i className="material-icons"> flash_on </i></div>
					</div>

					<div styleName="partyItem">
						<div styleName="partyTitle">在野黨</div>
						<div styleName="partyName">這裡是黨名</div>
						<div styleName="partyScore">2.2 萬<i className="material-icons"> flash_on </i></div>
					</div>
					<div styleName="partyItem">
						<div styleName="partyTitle"></div>
						<div styleName="partyName">這裡是黨名</div>
						<div styleName="partyScore">1328<i className="material-icons"> flash_on </i></div>
					</div>
				</div>
				<div styleName="rightSidebarButton showPartyButton">顯示更多政黨</div>
			</div>
		</div>
	</>;
}