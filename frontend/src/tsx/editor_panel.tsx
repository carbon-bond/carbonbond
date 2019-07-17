import * as React from 'react';

import '../css/bottom_panel.css';
import { EditorPanelState, EditorPanelData } from './global_state';

export function EditorPanel(): JSX.Element | null {
	const { open, editor_panel_data, closeEditorPanel, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	function onTitleClick(): void {
		if (open) {
			closeEditorPanel();
		} else {
			openEditorPanel();
		}
	}
	function deleteEditor(): void {
		// TODO: 跳視窗警告
		setEditorPanelData(null);
	}
	if (editor_panel_data) {
		return <div styleName='singlePanel editorPanel'>
			<div styleName='roomTitle title'>
				<div styleName='leftSet'>發表文章</div>
				<div styleName='middleSet' onClick={() => onTitleClick()}>
					b/{editor_panel_data.board_name}
				</div>
				<div styleName='rightSet'>
					<div styleName='button' onClick={() => deleteEditor()}>✗</div>
				</div>
			</div>
			{
				(() => {
					if (open) {
						return <EditorBody data={editor_panel_data}/>
					}
				})()
			}
		</div>;
	} else if (open) {
		// TODO: 錯誤處理，明明沒有文章在編輯，竟然還開著編輯視窗
		return null;
	} else {
		return null;
	}
}

function EditorBody(props: { data: EditorPanelData }): JSX.Element {
	return <div styleName='editorBody'>
		<input styleName='articleTitle' placeholder='文章標題'/>
		<textarea styleName='articleContent' placeholder='文章內容'/>
	</div>;
}