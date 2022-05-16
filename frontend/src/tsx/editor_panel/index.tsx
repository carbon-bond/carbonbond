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
import * as force_util from '../../ts/force_util';
import { UserState } from '../global_state/user';
import { BondLine } from '../article_card';
import { useNavigate } from 'react-router';
import { getBoardInfo } from '../board';

function useDeleteEditor(): () => void {
	const { setEditorPanelData }
		= EditorPanelState.useContainer();
	return () => {
		if (confirm('確定要結束編輯文章？')) {
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
	let content = editor_panel_data!.value.content;

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
				value: {
					...editor_panel_data.value,
					content: {
						...editor_panel_data.value.content,
						[field.name]: evt.target.value
					}
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
			<span className={style.dataType}>{`${force_util.show_datatype(field.kind)}`}</span>
		</label>
		<SingleField {...props} />
	</div>;
};

function ShowFields(props: {
	fields: force.Field[],
	validate_info: ValidateInfo,
	set_info: (info: ValidateInfo) => void
}): JSX.Element {
	let input_fields = [];
	for (let field of props.fields) {
		input_fields.push(
			<Field
				validate_info={props.validate_info[field.name]}
				set_info={(info) => props.set_info({
					...props.validate_info,
					[field.name]: info
				})}
				key={field.name}
				field={field} />);
	}
	return <div className={style.fields}>{input_fields}</div>;
}

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

// 由於看板被編輯後，分類的欄位名稱、型別可能改變（簡稱爲格式改變）、甚至整個分類被刪除
// 但草稿跟以前的文章的格式並不會跟着改變
// 當載入到編輯器時，可能會找不到能夠匹配的分類
// 處理方式可分爲以下幾種方式：
// 1. 載入草稿，分類仍然存在，但格式已經改變
// => 顯示唯讀文本，要求選擇分類。提示一個按鈕可切換到同名分類
// 2. 載入草稿，分類已經不存在
// => 顯示唯讀文本，要求選擇分類
// 3. 編輯文章，分類仍然存在，但格式已經改變
// => 提示一個按鈕可切換到同名分類
// 4. 編輯文章，分類已經不存在
// => 提示分類已經不存在，但仍可繼續使用原格式
type ValidateInfo = { [index: string]: string | undefined };
function EditorBody(): JSX.Element {
	const { minimizeEditorPanel, setEditorPanelData, editor_panel_data, setUpdatedArticleId } = EditorPanelState.useContainer();
	const { setDraftData } = DraftState.useContainer();
	const { handleSubmit } = useForm();
	const [validate_info, set_info] = useState<ValidateInfo>({});
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
	let found_category = force.categories.find(c => c.name == editor_panel_data.category_name);
	const using_legacy_fields = (found_category == undefined) ||
		!force_util.equal_fields(editor_panel_data.value.fields, found_category.fields);

	const onSubmit = (): void => {
		if (found_category == undefined) {
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
					category_name: found_category.name,
					use_legazy_fields: using_legacy_fields,
					title: editor_panel_data.title,
					content: generate_submit_content(editor_panel_data.value.fields, editor_panel_data.value.content),
					bonds: editor_panel_data.bonds.map(bond => {return {to: bond.article_meta.id, tag: bond.tag};}),
					draft_id: editor_panel_data.draft_id ?? null,
					anonymous: editor_panel_data.anonymous
				};
				request = API_FETCHER.articleQuery.updateArticle(article);
			} else {
				let article: NewArticle = {
					board_id: board.id,
					category_name: found_category.name,
					title: editor_panel_data.title,
					content: generate_submit_content(editor_panel_data.value.fields, editor_panel_data.value.content),
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
			editor_panel_data.category_name ?? null,
			editor_panel_data.title,
			JSON.stringify(editor_panel_data.value.content),
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

	function changeCategory(new_category_name: string): void {
		let new_category = force.categories.find(category => category.name == new_category_name)!;
		if (!editor_panel_data) {
			throw new Error('誤用 onChangeCategory');
		}
		if (editor_panel_data.value.fields.length > 0) {
			let result = force_util.translate(editor_panel_data.value.fields, new_category.fields, editor_panel_data.value.content);
			let ok = true;
			if (result.strategy.kind == force_util.TranslateKind.NotFit) {
				ok = confirm(
					'警告！' +
					`原文中的${result.strategy.not_fit_fields.map(f => force_util.get_field_name(f))}欄位` +
					`，無法對應到${new_category.name}分類中的任何欄位，將被丟棄，` +
					'若您仍需要這些欄位的文本，請先儲存草稿再認');
			} else if (result.strategy.kind == force_util.TranslateKind.Shrink) {
				ok = confirm(`原文中的${result.strategy.from_fields.map(f => force_util.get_field_name(f))}欄位，` +
					`將被塞入${new_category.name}分類中的${force_util.get_field_name(result.strategy.to_field)}欄位`);
			}
			if (ok) {
				setEditorPanelData({
					...editor_panel_data,
					category_name: new_category.name,
					value: {
						content: result.content,
						fields: new_category.fields,
					},
				});
			}
		} else {
			let content = force_util.create_new_content(new_category.fields);
			setEditorPanelData({
				...editor_panel_data,
				category_name: new_category.name,
				value: {
					content,
					fields: new_category.fields
				},
			});
		}

	}

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
							.then(board => setEditorPanelData({ ...editor_panel_data, board, category_name: '' }))
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
					value={found_category?.name ?? ''}
					onChange={(evt) => changeCategory(evt.target.value)}
				>
					<option value="" disabled hidden>請選擇文章分類</option>
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
					const EditingContent = (): JSX.Element => <>
						<div>以下是您的文章內容：</div>
						<ShowContent {...editor_panel_data.value} />
					</>;
					// XXX: 如果文章已經發出，又是草稿，將無法儲存
					// 應在更新草稿時也加上 use_legacy_fields 選項
					if (editor_panel_data.id) {
						if (found_category == undefined) {
							return <div>
								<div>本文所屬分類 {editor_panel_data.category_name} 已經不存在，但您仍可以原本格式編輯</div>
								<ShowFields fields={editor_panel_data.value.fields} validate_info={validate_info} set_info={set_info}/>
							</div>;
						} else if (using_legacy_fields) {
							return <div>
								<div>本文所屬分類 {editor_panel_data.category_name} 已經被版主修改</div>
								<div>您可<button onClick={() => changeCategory(editor_panel_data.category_name!)}>點此轉換到新格式</button>，也可保持原格式不變</div>
								<ShowFields fields={editor_panel_data.value.fields} validate_info={validate_info} set_info={set_info} />
							</div>;
						} else {
							return <ShowFields fields={found_category.fields} validate_info={validate_info} set_info={set_info} />;
						}
					} else if (editor_panel_data.draft_id) {
						if (found_category == undefined) {
							return <div>
								<div>本草稿所屬分類 {editor_panel_data.category_name} 已經不存在，請重新選擇分類</div>
								{ editor_panel_data.value.fields.length > 0 ? <EditingContent /> : <></> }
							</div>;
						} else if (using_legacy_fields) {
							return <div>
								<div>本草稿所屬分類 {editor_panel_data.category_name} 的格式已經被版主修改</div>
								<div>請<button onClick={() => changeCategory(editor_panel_data.category_name!)}>點此轉換文章格式</button></div>
								<div>或重新選擇分類</div>
								{ editor_panel_data.value.fields.length > 0 ? <EditingContent /> : <></> }
							</div>;
						} else {
							return <ShowFields fields={found_category.fields} validate_info={validate_info} set_info={set_info} />;
						}
					} else if (editor_panel_data.category_name == undefined || editor_panel_data.category_name == '' || found_category == undefined) {
						return <div>
							<div>請選擇分類</div>
							{ editor_panel_data.value.fields.length > 0 ? <EditingContent /> : <></> }
						</div>;
					} else {
						return <ShowFields fields={found_category.fields} validate_info={validate_info} set_info={set_info}/>;
					}
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

function ShowContent(props: {fields: force.Field[], content: force_util.Content} ): JSX.Element {
	return <div>
		{
			props.fields.map(field => {
				return <div className={style.field} key={field.name}>
					<div>{field.name}:</div>
					{props.content[field.name]}
				</div>;
			})
		}
	</div>;
}

export { EditorPanel };