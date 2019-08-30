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
		<div className="rightSidebarItem">
			{ user_state.login && <div onClick={() => onEditClick()} styleName="postArticleButton">發表文章</div> }
		</div>
		<div className="rightSidebarItem">
			<div styleName="rightSidebarBlock">看板簡介</div>
		</div>

		<div className="rightSidebarItem">
			<div styleName="rightSidebarBlock">政黨列表</div>
		</div>
	</>;
}