import * as React from 'react';
import { produce } from 'immer';
import { InvalidMessage } from '../../tsx/components/invalid_message';
const { useState, useEffect } = React;
import { DraftState } from '../global_state/draft';
import { WindowState, EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap, unwrap_or } from '../../ts/api/api';
import { BoardName, force, NewArticle, UpdatedArticle } from '../../ts/api/api_trait';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { SimpleModal } from '../../tsx/components/modal_window';


import bottom_panel_style from '../../css/bottom_panel/bottom_panel.module.css';
const { roomTitle, leftSet, middleSet, rightSet, button } = bottom_panel_style;
import style from '../../css/bottom_panel/editor.module.css';
import { toastErr } from '../utils';
import { new_content, show_datatype } from '../../ts/force_util';
import { UserState } from '../global_state/user';
import { BondLine } from '../article_card';
import { useNavigate } from 'react-router';
import { getBoardInfo } from '../board';

function useDeleteEditor(): () => void {
	const { setEditorPanelData }
		= EditorPanelState.useContainer();
	return () => {
		if (confirm('確定要結束發文？')) {
			setEditorPanelData(null);
		}
	};
}

function EditorUpperBar(): JSX.Element {
	const { window_state, editor_panel_data, minimizeEditorPanel, expandEditorPanel, openEditorPanel }
		= EditorPanelState.useContainer();
	const deleteEditor = useDeleteEditor();
	function onTitleClick(): void {
		if (window_state == WindowState.Minimize) {
			openEditorPanel();
		} else {
			minimizeEditorPanel();
		}
	}
	if (editor_panel_data == null) { return <></>; }
	return <div className={roomTitle}>
		<div onClick={() => onTitleClick()} className={leftSet}>
			{editor_panel_data.board.board_name + ' / ' +
				(editor_panel_data.title.length == 0 ? '新文章' : editor_panel_data.title)}
		</div>
		<div onClick={() => onTitleClick()} className={middleSet}>
		</div>
		<div className={rightSet}>
			{
				(function () {
					if (window_state == WindowState.Minimize) {
						return <>
							<div className={button} onClick={openEditorPanel}>↑</div>
							<div className={button} onClick={expandEditorPanel}>⇱</div>
							<div className={button} onClick={deleteEditor}>✗</div>
						</>;
					} else if (window_state == WindowState.Bottom) {
						return <>
							<div className={button} onClick={minimizeEditorPanel}>↓</div>
							<div className={button} onClick={expandEditorPanel}>⇱</div>
							<div className={button} onClick={deleteEditor}>✗</div>
						</>;
					} else if (window_state == WindowState.Expanded) {
						return <>
							<div className={button} onClick={minimizeEditorPanel}>↓</div>
							<div className={button} onClick={openEditorPanel}>⇲</div>
							<div className={button} onClick={deleteEditor}>✗</div>
						</>;
					}
				})()
			}
		</div>
	</div>;
};

function MinimizeEditor(): JSX.Element {
	return <div className={style.editorPanel}>
		<EditorUpperBar />
	</div>;
}

function BottomEditor(): JSX.Element {
	return <div className={style.editorPanel}>
		<EditorUpperBar />
		<EditorBody />
	</div>;
}

function ExpandedEditor(): JSX.Element {
	const { minimizeEditorPanel }
		= EditorPanelState.useContainer();
	return <SimpleModal close={minimizeEditorPanel}>
		<div className={style.expandedEditorPanel}>
			<EditorUpperBar />
			<EditorBody />
		</div>
	</SimpleModal>;
}

function EditorPanel(): JSX.Element | null {
	const { window_state, editor_panel_data }
		= EditorPanelState.useContainer();
	if (editor_panel_data) {
		if (window_state == WindowState.Minimize) {
			return <MinimizeEditor />;
		} else if (window_state == WindowState.Bottom) {
			return <BottomEditor />;
		} else if (window_state == WindowState.Expanded) {
			return <ExpandedEditor />;
		}
		throw new Error('WindowState 未窮盡');
	} else {
		return null;
	}
}

type ChangeEvent = { target: { value: string } };

type FieldProps = { field: force.Field, validate_info: string | undefined, set_info: (info: string | undefined) => void };

const SingleField = (props: FieldProps): JSX.Element => {
	const { field } = props;
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();

	const validate_info = props.validate_info;
	let content = editor_panel_data!.content;

	if (editor_panel_data == null) { return <></>; }

	const input_props = {
		placeholder: field.name,
		id: field.name,
		value: content[field.name],
		onChange: (evt: ChangeEvent) => {
			if (field.kind == force.FieldKind.Number) {
				if (!Number.isNaN(Number(evt.target.value))) {
					props.set_info('必須輸入一個整數');
				} if (!Number.isSafeInteger(Number(evt.target.value))) {
					props.set_info('超出可接受的整數範圍');
				} else {
					props.set_info(undefined);
				}
			}
			setEditorPanelData({
				...editor_panel_data,
				content: {
					...editor_panel_data.content,
					[field.name]: evt.target.value
				}
			});
		}
	};
	switch (field.kind) {
		case force.FieldKind.MultiLine:
			return <>
				<textarea {...input_props} />
				{validate_info && <InvalidMessage msg={validate_info} />}
			</>;
		case force.FieldKind.OneLine: {
			return <>
				<input {...input_props} />
				{validate_info && <InvalidMessage msg={validate_info} />}
			</>;
		}
		case force.FieldKind.Number: {
			return <>
				<input {...input_props} type="text" onKeyPress={(evt) => {
					if (!(/[0-9]/.test(evt.key) || /-/.test(evt.key))) {
						evt.preventDefault();
					}
				}} />
				{validate_info && <InvalidMessage msg={validate_info} />}
			</>;
		}
	}
};

const Field = (props: FieldProps): JSX.Element => {
	const { field } = props;
	const { editor_panel_data } = EditorPanelState.useContainer();

	if (editor_panel_data == null) { return <></>; }
	return <div key={field.name} className={style.field}>
		<label htmlFor={field.name}>
			{
				field.name == '' ?
					<></> :
					<span className={style.fieldName}>{field.name}</span>
			}
			<span className={style.dataType}>{`${show_datatype(field.kind)}`}</span>
		</label>
		<SingleField {...props} />
	</div>;
};

function generate_submit_content(fields: force.Field[], original_content: { [index: string]: string }): string {
	let content: { [index: string]: string | number } = {};
	for (const field of fields) {
		if (field.kind == force.FieldKind.Number) {
			content[field.name] = Number(original_content[field.name]);
		} else {
			content[field.name] = original_content[field.name];
		}
	}
	return JSON.stringify(content);
}

// function equal_fields(x: force.Field[], y: force.Field[]): boolean {
// 	if (x.length != y.length) {
// 		return false;
// 	}
// 	for (let i = 0; i < x.length; i++) {
// 		if (x[i].kind != y[i].kind || x[i].name != y[i].name) {
// 			return false;
// 		}
// 	}
// 	return true;
// }

function EditorBody(): JSX.Element {
	const { minimizeEditorPanel, setEditorPanelData, editor_panel_data, setUpdatedArticleId } = EditorPanelState.useContainer();
	const { setDraftData } = DraftState.useContainer();
	const { handleSubmit } = useForm();
	const [validate_info, set_info] = useState<{ [index: string]: string | undefined }>({});
	const { user_state } = UserState.useContainer();
	const board = editor_panel_data!.board;
	const [board_options, setBoardOptions] = useState<BoardName[]>([{
		id: board.id,
		board_name: board.board_name,
	}]);
	const board_info = getBoardInfo(board);
	useEffect(() => {
		API_FETCHER.boardQuery.queryBoardNameList()
			.then(data => unwrap(data))
			.then(data => setBoardOptions(data))
			.catch(err => console.log(err));
	}, []);
	const force = board.force;
	const navigate = useNavigate();

	if (editor_panel_data == null || !user_state.login) { return <></>; }
	let category = force.categories.find(c => c.name == editor_panel_data.category);

	// let categories: force.Category[] = structuredClone(force.categories);
	// let category_name = editor_panel_data.category;
	// if (editor_panel_data.legacy_fields && editor_panel_data.category != '') {
	// 	if (category == undefined || !equal_fields(category.fields, editor_panel_data.legacy_fields)) {
	// 		// TODO: 限制所有分類名不得含有空白
	// 		category_name = `${editor_panel_data.category} （已過時）`;
	// 		categories.push({
	// 			name: category_name,
	// 			fields: editor_panel_data.legacy_fields!
	// 		});
	// 	}
	// }

	const onSubmit = (): void => {
		if (category == undefined) {
			toastErr('請先選擇分類！');
			return;
		} else if (!Object.values(validate_info).every(info => info == undefined)) {
			toastErr('尚未完全符合格式');
			return;
		} else {
			let request;
			if (editor_panel_data.id) {
				let article: UpdatedArticle = {
					article_id: editor_panel_data.id,
					category_name: category.name,
					use_legazy_fields: false, // TODO: 視情況決定
					title: editor_panel_data.title,
					content: generate_submit_content(category.fields, editor_panel_data.content),
					bonds: editor_panel_data.bonds.map(bond => {return {to: bond.article_meta.id, tag: bond.tag};}),
					draft_id: editor_panel_data.draft_id ?? null,
					anonymous: editor_panel_data.anonymous
				};
				request = API_FETCHER.articleQuery.updateArticle(article);
			} else {
				let article: NewArticle = {
					board_id: board.id,
					category_name: category.name,
					title: editor_panel_data.title,
					content: generate_submit_content(category.fields, editor_panel_data.content),
					bonds: editor_panel_data.bonds.map(bond => {return {to: bond.article_meta.id, tag: bond.tag};}),
					draft_id: editor_panel_data.draft_id ?? null,
					anonymous: editor_panel_data.anonymous
				};
				request = API_FETCHER.articleQuery.createArticle(article);
			}
			let info = editor_panel_data.id ?  '更新文章成功' : '發文成功';
			request
				.then(data => unwrap(data))
				.then(id => {
					toast(info);
					if (editor_panel_data.id) {
						setUpdatedArticleId(id);
					}
					minimizeEditorPanel();
					navigate(`${board_info.to_url()}/article/${id}`);
					setEditorPanelData(null);
					return API_FETCHER.articleQuery.queryDraft();
				})
				.then(res => unwrap(res))
				.then(drafts => setDraftData(drafts))
				.catch(err => {
					toastErr(err);
				});
		}
	};

	const saveDraft = (): void => {
		API_FETCHER.articleQuery.saveDraft(
			editor_panel_data.draft_id ?? null,
			editor_panel_data.board.id,
			editor_panel_data.category ?? null,
			editor_panel_data.title,
			JSON.stringify(editor_panel_data.content),
			// XXX: 文章標題可能會改變，草稿中顯示的仍然會是舊標題
			JSON.stringify(editor_panel_data.bonds),
			editor_panel_data.anonymous)
			.then(data => unwrap(data))
			.then(id => {
				setEditorPanelData({
					draft_id: id,
					...editor_panel_data,
				});
			})
			.then(() => {
				return API_FETCHER.articleQuery.queryDraft();
			})
			.then(drafts => {
				setDraftData(unwrap_or(drafts, []));
				toast('儲存草稿成功');
			})
			.catch(err => {
				toastErr(err);
			});
	};

	return <div className={style.editorBody}>
		<div className={style.form}>
			<div className={style.location}>
				<select required
					className={style.board}
					value={board.id}
					disabled={editor_panel_data.id != undefined}
					onChange={(evt) => {
						API_FETCHER.boardQuery.queryBoardById(parseInt(evt.target.value))
							.then(data => unwrap(data))
							.then(board => setEditorPanelData({ ...editor_panel_data, board, category: '', legacy_fields: undefined }))
							.catch(err => console.error(err));
					}}
				>
					<option value="" disabled hidden>看板</option>
					{
						board_options.map(board =>
							<option
								value={board.id}
								key={board.id}
							>
								{board.board_name}
							</option>)
					}
				</select>
				<select required
					className={style.category}
					value={editor_panel_data.category}
					onChange={(evt) => {
						let category = force.categories.find(category => category.name == evt.target.value)!;
						let content = new_content(category);
						setEditorPanelData({ ...editor_panel_data, category: category.name, content, legacy_fields: undefined });
					}}
				>
					<option value="" disabled hidden>文章分類</option>
					{
						force.categories.map(category =>
							<option value={category.name} key={category.name}>{category.name}</option>)
					}
				</select>
				<label className={style.anonymous}>
					<input type="checkbox"
						checked={editor_panel_data.anonymous}
						onChange={(evt) => setEditorPanelData({ ...editor_panel_data, anonymous: evt.target.checked })} />
					匿名
				</label>
			</div>
			<input
				className={style.articleTitle}
				placeholder="文章標題"
				name="title"
				onChange={(evt) => {
					const nxt_state = produce(editor_panel_data, (draft) => { draft.title = evt.target.value; });
					setEditorPanelData(nxt_state);
				}}
				value={editor_panel_data.title}
			></input>
			{
				editor_panel_data.bonds.map((bond, index) => {
					return <div className={style.bond} key={`${bond.article_meta.id}#${bond.tag}`}>
						<BondLine mini_meta={bond.article_meta}>
							<button onClick={() => {
								setEditorPanelData(produce(editor_panel_data, (data) => {
									data.bonds.splice(index, 1);
								}));
							}}>✗</button>
							<select
								value={bond.tag}
								onChange={(evt: { target: { value: string } }) => {
									setEditorPanelData(produce(editor_panel_data, data => {
										data.bonds[index].tag = evt.target.value;
									}));
								}} >
								{
									board.force.suggested_tags.map((tag) => {
										return <option key={tag} value={tag}>{tag}</option>;
									})
								}
							</select>
						</BondLine>
					</div>;
				})
			}
			{
				(() => {
					if (editor_panel_data.category == undefined || editor_panel_data.category == '') {
						return <></>;
					}
					let input_fields = [];
					if (category == undefined) {
						return <></>;
					}
					for (let field of category.fields) {
						input_fields.push(
							<Field
								validate_info={validate_info[field.name]}
								set_info={(info) => set_info({
									...validate_info,
									[field.name]: info
								})}
								key={field.name}
								field={field} />);
					}
					return <div className={style.fields}>{input_fields}</div>;
				})()
			}
		</div>
		<div className={style.buttonBar}>
			<div className={style.leftSet}>
				<button className={style.publish} onClick={handleSubmit(onSubmit)}>發佈</button>
				<button className={style.save} onClick={saveDraft}>存稿</button>
			</div>
		</div>
	</div>;
}

export { EditorPanel };