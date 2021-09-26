import * as React from 'react';
import { produce } from 'immer';
import { InvalidMessage } from '../../tsx/components/invalid_message';
const { useState, useEffect, useMemo } = React;
import { DraftState } from '../global_state/draft';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { WindowState, EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap, unwrap_or } from '../../ts/api/api';
import { BoardName, BoardType } from '../../ts/api/api_trait';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Validator } from '../../ts/validator';
import * as Force from '../../../../force/typescript/index';
import { ShowText } from '../../tsx/board_switch/article_page';
import { Modal } from '../../tsx/article_card/modal';


import bottom_panel_style from '../../css/bottom_panel/bottom_panel.module.css';
const { roomTitle, leftSet, middleSet, rightSet, button } = bottom_panel_style;
import style from '../../css/bottom_panel/editor.module.css';
import { SimpleArticleCardById } from '../article_card';
import { toastErr } from '../utils';
import { new_content, new_bond } from '../../ts/force_util';

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

const SingleField = (props: { field: Force.Field, validator: Validator }): JSX.Element => {
	const { field, validator } = props;
	const [validate_info, setValidateInfo] = useState<undefined | string>(undefined);
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();

	let content = editor_panel_data!.content;

	useEffect(() => {
		validator.validate_datatype(field.datatype, content[field.name])
			.then(res => setValidateInfo(res));
	}, [field, content, validator]);

	if (editor_panel_data == null) { return <></>; }

	const input_props = {
		placeholder: field.name,
		id: field.name,
		value: content[field.name],
		onChange: (evt: ChangeEvent) => {
			setEditorPanelData({
				...editor_panel_data,
				content: {
					...editor_panel_data.content,
					[field.name]: evt.target.value
				}
			});
		}
	};
	if (field.datatype.t.kind == 'text') {
		return <>
			<textarea {...input_props} />
			{validate_info && <InvalidMessage msg={validate_info} />}
		</>;
	} else if (field.datatype.t.kind == 'bond') {
		const onChange = (bond_field: string) => {
			return (evt: ChangeEvent) => {
				setEditorPanelData(produce(editor_panel_data, nxt => {
					nxt.content[field.name][bond_field] = evt.target.value;
				}));
			};
		};
		return <EditBond onChange={onChange} bond={editor_panel_data.content[field.name]} validate_info= {validate_info} />;
	} else {
		return <>
			<input {...input_props} />
			{validate_info && <InvalidMessage msg={validate_info} />}
		</>;
	}
};

type BondOnChange = (bond_field: string) => ((evt: ChangeEvent) => void);
type UnProcessedBond = {
	target_article: string,
	tag: string,
	energy: string
};

function EditBond(props: { onChange: BondOnChange, bond: UnProcessedBond, validate_info: string | undefined }): JSX.Element {
	return <>
		<div className={style.bond}>
			<input className={style.id} placeholder="文章代碼"
				value={props.bond.target_article}
				onChange={props.onChange('target_article')} />
			<input className={style.tag} placeholder="標籤（選填）"
				value={props.bond.tag}
				onChange={props.onChange('tag')} />
			<select
				value={props.bond.energy}
				onChange={props.onChange('energy')} >
				<option value="1">正面</option>
				<option value="0">中立</option>
				<option value="-1">負面</option>
			</select>
		</div>
		{props.validate_info && <InvalidMessage msg={props.validate_info} />}
	</>;
}

// eslint-disable-next-line
function ShowItem(props: { t: Force.BasicDataType, value: any }): JSX.Element {
	if (props.t.kind == 'text') {
		return <div className={style.textValueWrap}>
			<ShowText text={props.value} />
		</div>;
	} else if (props.t.kind == 'bond') {
		return <SimpleArticleCardById article_id={Number(props.value.target_article)} />;
	} else {
		return <>{props.value}</>;
	}
}

const ArrayField = (props: { field: Force.Field, validator: Validator }): JSX.Element => {
	const { field } = props;
	const [input_validate_info, setInputValidateInfo] = useState<undefined | string>(undefined);
	const [array_validate_info, setArrayValidateInfo] = useState<undefined | string>(undefined);
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();

	useEffect(() => {
		props.validator.validate_datatype(field.datatype, editor_panel_data!.content[field.name].confirmed)
			.then(info => setArrayValidateInfo(info));
	});

	if (editor_panel_data == null) { return <></>; }

	const value = editor_panel_data.content[field.name].candidate;
	// eslint-disable-next-line
	const setValue = (v: any): void => {
		console.log(`content = ${JSON.stringify(editor_panel_data.content, null, 2)}`);
		setEditorPanelData(produce(editor_panel_data, nxt => {
			nxt.content[field.name].candidate = v;
		}));
	};

	const show_list = (): JSX.Element => {
		let list = editor_panel_data.content[field.name].confirmed;
		console.log(`list = ${JSON.stringify(editor_panel_data.content, null, 2)}`);
		if (list instanceof Array) {
			return <div>
				{
					list.map((item, index) => {
						return <div key={index}>
							<span className={style.deleteButton} onClick={() => {
								const next_state = produce(editor_panel_data, nxt => {
									nxt.content[field.name].confirmed.splice(index, 1);
								});
								setEditorPanelData(next_state);
							}}>✗</span>
							<ShowItem t={field.datatype.t} value={item} />
						</div>;
					})
				}
			</div>;
		} else {
			return <></>;
		}
	};

	const push_data = (): void => {
		if (input_validate_info == undefined) {
			const next_state = produce(editor_panel_data, (nxt) => {
				nxt.content[field.name].confirmed.push(value);
				if (field.datatype.t.kind == 'bond') {
					nxt.content[field.name].candidate = new_bond();
				} else {
					nxt.content[field.name].candidate = '';
				}
			});
			setEditorPanelData(next_state);
			props.validator.validate_datatype(field.datatype, editor_panel_data!.content[field.name].confirmed)
				.then(info => setArrayValidateInfo(info));
		}
	};

	const on_enter = (evt: { key: string }): void => {
		if (evt.key == 'Enter') {
			push_data();
			// @ts-ignore
			evt.preventDefault();
		}
	};

	const input_props = {
		placeholder: field.name,
		id: field.name,
		value,
		onChange: (evt: ChangeEvent) => {
			setValue(evt.target.value);
			props.validator.validate_basic_datatype(field.datatype.t, evt.target.value)
				.then(res => setInputValidateInfo(res));
		},
	};
	if (field.datatype.t.kind == 'text') {
		return <>
			{array_validate_info && <InvalidMessage msg={array_validate_info} />}
			{show_list()}
			<button type="button" onClick={push_data}>+</button>
			<textarea {...input_props} />
			{input_validate_info && <InvalidMessage msg={input_validate_info} />}
		</>;
	} else if (field.datatype.t.kind == 'bond') {
		const onChange = (bond_field: string) => {
			return (evt: ChangeEvent) => {
				const next_state = produce(editor_panel_data, nxt => {
					nxt.content[field.name].candidate[bond_field] = evt.target.value;
				});
				setEditorPanelData(next_state);
				props.validator.validate_basic_datatype(field.datatype.t, next_state.content[field.name].candidate)
					.then(res => setInputValidateInfo(res));
			};
		};
		return <>
			{array_validate_info && <InvalidMessage msg={array_validate_info} />}
			{show_list()}
			<button type="button" onClick={push_data}>+</button>
			<EditBond onChange={onChange} bond={value} validate_info={input_validate_info} />
		</>;
	} else {
		return <>
			{array_validate_info && <InvalidMessage msg={array_validate_info} />}
			{show_list()}
			<input {...input_props} onKeyDown={on_enter} />
			{input_validate_info && <InvalidMessage msg={input_validate_info} />}
		</>;
	}
};

const Wrap = (element: JSX.Element, field: Force.Field): JSX.Element => {
	return <div key={field.name} className={style.field}>
		<label htmlFor={field.name}>
			{`${field.name}`}
			<span className={style.dataType}>{`${Force.show_data_type(field.datatype)}`}</span>
		</label>
		{element}
	</div>;
};

// @ts-ignore
const Field = (props: { field: Force.Field, validator: Validator }): JSX.Element => {
	const { field } = props;
	const { editor_panel_data } = EditorPanelState.useContainer();

	if (editor_panel_data == null) { return <></>; }

	if (field.datatype.kind == 'single') {
		return Wrap(<SingleField {...props}/>, field);
	} else if (field.datatype.kind == 'optional') {
		// TODO: 改為可選
		return Wrap(<SingleField {...props} />, field);
	} else if (field.datatype.kind == 'array') {
		return Wrap(<ArrayField {...props} />, field);
	}
};

function _EditorBody(props: RouteComponentProps): JSX.Element {
	const { minimizeEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const { setDraftData } = DraftState.useContainer();
	const { handleSubmit } = useForm();
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
	const force = useMemo( () => Force.parse(board.force), [board]);
	const validator = useMemo(() => new Validator(board.id), [board]);

	if (editor_panel_data == null) { return <></>; }

	// @ts-ignore
	const onSubmit = (): void => {
		let category = force.categories.get(editor_panel_data.category!)!;
		// eslint-disable-next-line
		let content: { [index: string]: any } = {};
		for (let field of category.fields) {
			if (field.datatype.kind == 'array') {
				if (field.datatype.t.kind == 'number') {
					content[field.name] = (editor_panel_data.content[field.name].confirmed as string[]).map(Number);
				} else {
					content[field.name] = editor_panel_data.content[field.name].confirmed;
				}
			} else {
				if (field.datatype.t.kind == 'number') {
					content[field.name] = Number(editor_panel_data.content[field.name]);
				} else {
					content[field.name] = editor_panel_data.content[field.name];
				}
			}
		}
		// XXX: 各個欄位 Field 組件中檢查過了，應嘗試快取該結果
		validator.validate_category(category, content)
			.then(info => {
				if (info != undefined) {
					toastErr('文章不符力語言格式，請檢查各欄位無誤再送出');
					return Promise.reject();
				}
			})
			.then(() => {

				for (let field of category.fields) {
					if (field.datatype.t.kind == 'bond') {
						type Bond = {
							target_article: string,
							energy: string,
							tag: string,
						};
						if (field.datatype.kind == 'array') {
							content[field.name] = content[field.name].map((bond: Bond) => ({
								energy: Number(bond.energy),
								target_article: Number(bond.target_article),
								tag: bond.tag.trim() == '' ? null : bond.tag
							}));
						} else {
							let bond = content[field.name];
							content[field.name] = {
								energy: Number(bond.energy),
								target_article: Number(bond.target_article),
								tag: bond.tag.trim() == '' ? null : bond.tag
							};
						}
					}
				}

				return API_FETCHER.articleQuery.createArticle(
					board.id,
					category.name,
					editor_panel_data.title,
					JSON.stringify(content),
					editor_panel_data.draft_id ?? null
				);
			})
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
	};

	const saveDraft = (): void => {
		API_FETCHER.articleQuery.saveDraft(
			editor_panel_data.draft_id ?? null,
			editor_panel_data.board.id,
			editor_panel_data.category ?? null,
			editor_panel_data.title,
			JSON.stringify(editor_panel_data.content))
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
						let category = force.categories.get(evt.target.value)!;
						let content = new_content(category);
						setEditorPanelData({ ...editor_panel_data, category: category.name, content });
					}}
				>
					<option value="" disabled hidden>文章分類</option>
					{
						Array.from(force.categories.keys()).map(name =>
							<option value={name} key={name}>{name}</option>)
					}
				</select>
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
					let category = force.categories.get(editor_panel_data.category);
					if (category == undefined) {
						return <></>;
					}
					for (let field of category.fields) {
						input_fields.push(
							<Field
								validator={validator}
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