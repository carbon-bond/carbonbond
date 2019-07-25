import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import '../css/bottom_panel.css';
import { EditorPanelState, EditorPanelData } from './global_state';
import { getGraphQLClient, extractErrMsg } from '../ts/api';
import { toast } from 'react-toastify';
import { DropDown } from './components';

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
			content: data.content
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
	const { editor_panel_data, setEditorPanelData } = EditorPanelState.useContainer();
	if (editor_panel_data) {
		let data = editor_panel_data;
		function onChange(name: string): void {
			for (let c of data.categories) {
				if (c.name == name) {
					setEditorPanelData({...data, cur_category: c });
					return;
				}
			}
		}
		return <DropDown
			btn_style={{
				width: 100,
				height: '100%',
				backgroundColor: 'white',
				borderStyle: 'solid',
				borderRadius: 2,
				borderColor: 'gray',
				borderWidth: 1,
				zIndex: 1
			}}
			background_style={{
				backgroundColor: '#eee',
				borderStyle: 'solid',
				borderColor: 'gray',
				borderWidth: 1,
				maxHeight: '60vh'
			}}
			hover_color='#ddd'
			option_style={{ height: 30 }}
			value={data.cur_category.name}
			onChange={s => onChange(s)}
			options={data.categories.map(c => c.name)} />;
	} else {
		throw new Error('尚未開始發文');
	}
}

type InputEvent<T> = React.ChangeEvent<T>;
function InputsForStructure(): JSX.Element | null {
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	if (editor_panel_data) {
		let data = editor_panel_data;
		function onChange<T extends HTMLInputElement | HTMLTextAreaElement>(
			evt: InputEvent<T>,
			index: number
		): void {
			if (editor_panel_data) {
				let ep_data = { ...data };
				ep_data.content[index] = evt.target.value;
				setEditorPanelData(ep_data);
			}
		}
		let single = data.cur_category.structure.length == 1;
		return <>
			{
				data.cur_category.structure.map((col, i) => {
					return <>
						{
							single ? null : <p styleName='colLabel'>
								{col.col_name} ({col.col_type})
							</p>
						}
						{
							(() => {
								if (col.col_type == 'Text') {
									return <textarea key={i}
										onChange={evt => onChange(evt, i)}
										value={data.content[i]}
										styleName='textInput'
										placeholder={single ? col.col_name : ''}
									/>;
								} else if (col.col_type == 'Line'
									|| col.col_type == 'Int'
									|| col.col_type.startsWith('Rating')
								) {
									return <input key={i}
										onChange={evt => onChange(evt, i)}
										value={data.content[i]}
										styleName='oneLineInput'
										placeholder={single ? col.col_name : ''}
									/>;
								}
							})()
						}
					</>;
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
		let data = editor_panel_data;
		let single = data.cur_category.structure.length == 1;
		let body_style = single ? {} : {
			width: '96%',
			marginLeft: '2%',
			marginRight: '2%',
		};
		return <div styleName='editorBody'>
			<div style={{ ...body_style }} styleName='editorInnerBody'>
				<div styleName='articleMeta'>
					<CategorySelector />
					<input className='articleTitle'
						onChange={evt => {
							setEditorPanelData({
								...data,
								title: evt.target.value
							});
						}}
						value={data.title}
						styleName='oneLineInput'
						placeholder='文章標題'
					/>
				</div>
				<div styleName='articleContent'>
					<InputsForStructure />
					<div>
						<button onClick={() => {
							createArticle(data).then(id => {
								props.onPost(id);
							}).catch(err => {
								toast.error(extractErrMsg(err));
							});
						}}>送出文章</button>
						<button>儲存草稿</button>
					</div>
				</div>
			</div>
		</div>;
	} else {
		throw new Error('沒有文章資料卻試圖編輯');
	}
}

const EditorPanel = withRouter(_EditorPanel);
export { EditorPanel };