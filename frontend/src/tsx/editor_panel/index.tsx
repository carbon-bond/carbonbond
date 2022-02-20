import * as React from 'react';
import { produce } from 'immer';
import { InvalidMessage } from '../../tsx/components/invalid_message';
const { useState, useEffect } = React;
import { DraftState } from '../global_state/draft';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { WindowState, EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap, unwrap_or } from '../../ts/api/api';
import { BoardName, BoardType, force } from '../../ts/api/api_trait';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Modal } from '../../tsx/article_card/modal';


import bottom_panel_style from '../../css/bottom_panel/bottom_panel.module.css';
const { roomTitle, leftSet, middleSet, rightSet, button } = bottom_panel_style;
import style from '../../css/bottom_panel/editor.module.css';
import { toastErr } from '../utils';
import { new_content, show_datatype } from '../../ts/force_util';
import { UserState } from '../global_state/user';

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
	return <Modal close={minimizeEditorPanel}>
		<div className={style.expandedEditorPanel}>
			<EditorUpperBar />
			<EditorBody />
		</div>
	</Modal>;
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

// type BondOnChange = (bond_field: string) => ((evt: ChangeEvent) => void);
// type UnProcessedBond = {
// 	target_article: string,
// 	tag: string,
// 	energy: string
// };

// function EditBond(props: { onChange: BondOnChange, bond: UnProcessedBond, validate_info: string | undefined }): JSX.Element {
// 	return <>
// 		<div className={style.bond}>
// 			<input className={style.id} placeholder="文章代碼"
// 				value={props.bond.target_article}
// 				onChange={props.onChange('target_article')} />
// 			<input className={style.tag} placeholder="標籤（選填）"
// 				value={props.bond.tag}
// 				onChange={props.onChange('tag')} />
// 			<select
// 				value={props.bond.energy}
// 				onChange={props.onChange('energy')} >
// 				<option value="1">正面</option>
// 				<option value="0">中立</option>
// 				<option value="-1">負面</option>
// 			</select>
// 		</div>
// 		{props.validate_info && <InvalidMessage msg={props.validate_info} />}
// 	</>;
// }

// @ts-ignore
const Field = (props: FieldProps): JSX.Element => {
	const { field } = props;
	const { editor_panel_data } = EditorPanelState.useContainer();

	if (editor_panel_data == null) { return <></>; }
	return <div key={field.name} className={style.field}>
		<label htmlFor={field.name}>
			{`${field.name}`}
			<span className={style.dataType}>{`${show_datatype(field.kind)}`}</span>
		</label>
		<SingleField {...props} />
	</div>;
};

function generate_submit_content(fields: force.Field[], original_content: {[index: string]: string}): string {
	let content: {[index: string]: string | number} = {};
	for (const field of fields) {
		if (field.kind == force.FieldKind.Number) {
			content[field.name] = Number(original_content[field.name]);
		} else {
			content[field.name] = original_content[field.name];
		}
	}
	return JSON.stringify(content);
}

function _EditorBody(props: RouteComponentProps): JSX.Element {
	const { minimizeEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const { setDraftData } = DraftState.useContainer();
	const { handleSubmit } = useForm();
	const [ validate_info, set_info ] = useState<{[index: string]: string | undefined}>({});
	const { user_state } = UserState.useContainer();
	const board = editor_panel_data!.board;
	const [board_options, setBoardOptions] = useState<BoardName[]>([{
		id: board.id,
		board_name: board.board_name,
	}]);
	useEffect(() => {
		API_FETCHER.boardQuery.queryBoardNameList()
			.then(data => unwrap(data))
			.then(data => setBoardOptions(data))
			.catch(err => console.log(err));
	}, []);
	const force = board.force;

	if (editor_panel_data == null || !user_state.login) { return <></>; }
	let category = force.categories.find(c => c.name == editor_panel_data.category);

	const onSubmit = (): void => {
		if (category == undefined) {
			toastErr('請先選擇分類！');
			return;
		} else if (!Object.values(validate_info).every(info => info == undefined)) {
			toastErr('尚未完全符合格式');
			return;
		} else {
			API_FETCHER.articleQuery.createArticle(
				board.id,
				category.name,
				editor_panel_data.title,
				generate_submit_content(category.fields, editor_panel_data.content),
				[],
				editor_panel_data.draft_id ?? null,
				editor_panel_data.anonymous
			)
			.then(data => unwrap(data))
			.then(id => {
				toast('發文成功');
				minimizeEditorPanel();
				props.history.push(`/app/${board.board_type === BoardType.General ? 'b' : 'user_board'}/${board.board_name}/a/${id}`);
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
					onChange={(evt) => {
						API_FETCHER.boardQuery.queryBoardById(parseInt(evt.target.value))
							.then(data => unwrap(data))
							.then(board => setEditorPanelData({ ...editor_panel_data, board, category: '' }))
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
						setEditorPanelData({ ...editor_panel_data, category: category.name, content });
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
					const nxt_state = produce(editor_panel_data, (draft) => {draft.title = evt.target.value;});
					setEditorPanelData(nxt_state);
				}}
				value={editor_panel_data.title}
			></input>
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

const EditorBody = withRouter(_EditorBody);
export { EditorPanel };