import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import '../../css/bottom_panel/bottom_panel.css';
import '../../css/bottom_panel/editor.css';
import { EditorPanelState } from '../global_state/editor_panel';

async function _createArticle(): Promise<void> {
	// dummy
}

function _EditorPanel(props: RouteComponentProps): JSX.Element | null {
	const { is_open, editor_panel_data, closeEditorPanel, openEditorPanel, setEditorPanelData }
		= EditorPanelState.useContainer();
	function onTitleClick(): void {
		if (is_open) {
			closeEditorPanel();
		} else {
			openEditorPanel();
		}
	}
	function deleteEditor(): void {
		// TODO: 跳視窗警告
		let do_delete = true;
		if (editor_panel_data ) {
			if (editor_panel_data.title != '') {
				do_delete = confirm('確定要結束發文？');
			} else {
				for (let c of editor_panel_data.content) {
					if (c != '') {
						do_delete = confirm('確定要結束發文？');
						break;
					}
				}
			}
		}
		if (do_delete) {
			setEditorPanelData(null);
		}
	}
	function _onPost(article_id: number): void {
		if (editor_panel_data) {
			props.history.push(`/app/b/${editor_panel_data.board.board_name}/a/${article_id}`);
			setEditorPanelData(null);
		}
	}
	if (editor_panel_data) {
		return <div styleName="editorPanel">
			<div styleName="roomTitle">
				<div styleName="leftSet">發表文章</div>
				<div onClick={() => onTitleClick()} styleName="middleSet">
					{ editor_panel_data.board.board_name }
				</div>
				<div styleName="rightSet">
					<div styleName="button">⇱</div>
					<div styleName="button" onClick={() => deleteEditor()}>✗</div>
				</div>
			</div>
			{
				is_open ?
					<EditorBody /> :
					<></>
			}
		</div>;
	} else {
		return null;
	}
}

function EditorBody(): JSX.Element {
	// const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	// if (editor_panel_data) {
	return <div styleName="editorBody">
		<div styleName="editorInnerBody">
		</div>
	</div>;
}

const EditorPanel = withRouter(_EditorPanel);
export { EditorPanel };