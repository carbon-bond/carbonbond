import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import '../css/bottom_panel.css';
import { EditorPanelState, EditorPanelData } from './global_state';
import { getGraphQLClient, extractErrMsg } from './api';
import { toast } from 'react-toastify';
import { Category } from './forum_util';

async function createArticle(data: EditorPanelData | null): Promise<number> {
	if (data) {
		let client = getGraphQLClient();
		const mutation = `
				mutation Post($board_name: String!, $category_name: String!, $content: [String!]!, $title: String!) {
					createArticle(
						boardName: $board_name,
						categoryName: $category_name,
						title: $title,
						content: $content
					)
				}
			`;
		let res: { createArticle: number } = await client.request(mutation, {
			board_name: data.board_name,
			category_name: data.cur_category.name,
			title: data.title,
			content: [data.content]
		});
		return res.createArticle;
	}
	throw new Error('尚未開始發文');
}

function _EditorPanel(props: RouteComponentProps): JSX.Element|null {
	const { open, editor_panel_data, closeEditorPanel, openEditorPanel, setEditorPanelData }
		= EditorPanelState.useContainer();
	function onTitleClick(): void {
		if (open) {
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
	function onPost(a_id: number): void {
		if (editor_panel_data) {
			props.history.push(`/app/b/${editor_panel_data.board_name}/a/${a_id}`);
			setEditorPanelData(null);
		}
	}
	if (editor_panel_data) {
		return <div styleName='singlePanel editorPanel'>
			<div styleName='roomTitle title'>
				<div styleName='leftSet'>發表文章</div>
				<div onClick={() => onTitleClick()} styleName='middleSet'>
					<div style={{ width: '100%', textAlign: 'center' }}>
						b/{editor_panel_data.board_name}
					</div>
				</div>
				<div styleName='rightSet'>
					<div styleName='button' onClick={() => deleteEditor()}>✗</div>
				</div>
			</div>
			{
				(() => {
					if (open) {
						return <EditorBody onPost={id => onPost(id)} />;
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

function CategorySelector(): JSX.Element {
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	function onTagClicked(category: Category): void {
		if (editor_panel_data) {
			setEditorPanelData({ ...editor_panel_data, cur_category: category });
		}
	}
	if (editor_panel_data) {
		return <div styleName='categorySelector'>
			{
				editor_panel_data.categories.map((c, i) => {
					if (c.name == editor_panel_data.cur_category.name) {
						return <div styleName='selected categoryTag' key={i}>
							<div styleName='tagTxt'>
								{c.name}
							</div>
						</div>;
					} else {
						return <div styleName='categoryTag' key={i} onClick={() => onTagClicked(c)}>
							<div styleName='tagTxt'>
								{c.name}
							</div>
						</div>;
					}
				})
			}
		</div>;
	} else {
		throw new Error('尚未開始發文');
	}
}

type InputEvent<T> = React.ChangeEvent<T>;
function InputsForStructure(): JSX.Element | null {
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	function onChange<T extends HTMLInputElement | HTMLTextAreaElement>(
		evt: InputEvent<T>,
		index: number
	): void {
		if (editor_panel_data) {
			let data = { ...editor_panel_data };
			data.content[index] = evt.target.value;
			setEditorPanelData(data);
		}
	}
	if (editor_panel_data) {
		return <>
			{
				editor_panel_data.cur_category.structure.map((col, i) => {
					if (col.col_type == 'Text') {
						return <textarea key={i}
							onChange={evt => onChange(evt, i)}
							value={editor_panel_data.content[i]}
							styleName='TextInput'
							placeholder={col.col_name}
						/>;
					} else if (col.col_type == 'Line'
						|| col.col_type == 'Int'
						|| col.col_type.startsWith('Rating')
					) {
						return <input key={i}
							onChange={evt => onChange(evt, i)}
							value={editor_panel_data.content[i]}
							styleName='oneLineInput'
							placeholder={col.col_name}
						/>;
					} else {
						return null;
					}
				})
			}
		</>;
	} else {
		return null;
	}
}

function EditorBody(props: { onPost: (id: number) => void }): JSX.Element {
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	if (editor_panel_data) {
		return <div styleName='editorBody'>
			<CategorySelector />
			<input
				onChange={evt => {
					let data = { ...editor_panel_data, title: evt.target.value };
					setEditorPanelData(data);
				}}
				value={editor_panel_data.title}
				styleName='oneLineInput'
				placeholder='文章標題'
			/>
			<div styleName='articleContent'>
				<InputsForStructure />
			</div>
			<div>
				<button onClick={() => {
					createArticle(editor_panel_data).then(id => {
						props.onPost(id);
					}).catch(err => {
						toast.error(extractErrMsg(err));
					});
				}}>送出文章</button>
				<button>儲存草稿</button>
			</div>
		</div>;
	} else {
		throw new Error('沒有文章資料卻試圖編輯');
	}
}

const EditorPanel = withRouter(_EditorPanel);
export { EditorPanel };