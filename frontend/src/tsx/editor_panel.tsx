import * as React from 'react';

import '../css/bottom_panel.css';
import { EditorPanelState, EditorPanelData } from './global_state';
import { getGraphQLClient } from './api';
import { toast } from 'react-toastify';

async function createArticle(data: EditorPanelData | null): Promise<number> {
	if (data) {
		if (typeof data.category_name == 'string') {
			let client = getGraphQLClient();
			const mutation = `
				mutation {
					createArticle(
						boardName: "${data.board_name}",
						categoryName: "${data.category_name}",
						title: "${data.title}"
					)
				}
			`;
			let res: { createArticle: number } = await client.request(mutation);
			return res.createArticle;
		}
		throw new Error('尚未指定分類');
	}
	throw new Error('尚未開始發文');
}

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
						return <EditorBody data={editor_panel_data} onPost={() => setEditorPanelData(null)}/>;
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

function EditorBody(props: { onPost: () => void, data: EditorPanelData }): JSX.Element {
	const { setEditorPanelData } = EditorPanelState.useContainer();
	return <div styleName='editorBody'>
		<input
			onChange={evt => {
				let data = { ...props.data, title: evt.target.value };
				setEditorPanelData(data);
				console.log(data);
			}}
			value={props.data.title}
			styleName='oneLineInput'
			placeholder='文章標題'
		/>
		<input
			onChange={evt => {
				let data = { ...props.data, category_name: evt.target.value };
				setEditorPanelData(data);
			}}
			value={props.data.category_name || ''}
			styleName='oneLineInput'
			placeholder='文章分類'
		/>
		<textarea styleName='articleContent' placeholder='文章內容' value={props.data.content}/>
		<div>
			<button onClick={() => {
				createArticle(props.data).then(() => {
					props.onPost();
				}).catch(err => {
					toast.error(err.message.split(':')[0]);
				});
			}}>送出文章</button>
			<button>儲存草稿</button>
		</div>
	</div>;
}