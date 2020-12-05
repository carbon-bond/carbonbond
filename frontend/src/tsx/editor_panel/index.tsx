import * as React from 'react';
import { produce } from 'immer';
import { InvalidMessage } from '../../tsx/components/invalid_message';
const { useState, useEffect, useMemo } = React;
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { BoardName } from '../../ts/api/api_trait';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Validator } from '../../ts/validator';
import * as Force from 'force';
import { ShowText } from '../../tsx/board_switch/article_page';


import '../../css/bottom_panel/bottom_panel.css';
import '../../css/bottom_panel/editor.css';
import { BasicDataType } from 'force';
import { SimpleArticleCardById } from '../article_card';
import { toastErr } from '../utils';

function EditorPanel(): JSX.Element | null {
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
		let do_delete = true;
		if (editor_panel_data ) {
			if (editor_panel_data.title != '') {
				do_delete = confirm('確定要結束發文？');
			} else {
				for (let k of Object.keys(editor_panel_data.content)) {
					if (editor_panel_data.content[k] != '') {
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
	if (editor_panel_data) {
		return <div styleName="editorPanel">
			<div styleName="roomTitle">
				<div onClick={() => onTitleClick()} styleName="leftSet">
					{ editor_panel_data.board.board_name + ' / ' +
					(editor_panel_data.title.length == 0 ? '新文章' : editor_panel_data.title)}
				</div>
				<div onClick={() => onTitleClick()} styleName="middleSet">
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

const SingleField = (props: {field: Force.Field, validator: Validator}): JSX.Element => {
	const { field, validator } = props;
	const [ validate_info, setValidateInfo ] = useState<undefined | string>(undefined);
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
		onChange: (evt: { target: { value: string } }) => {
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
	} else {
		return <>
			<input {...input_props} />
			{validate_info && <InvalidMessage msg={validate_info} />}
		</>;
	}
};


// eslint-disable-next-line
function ShowItem(props: { t: BasicDataType, value: any }): JSX.Element {
	if (props.t.kind == 'text') {
		return <div styleName="textValueWrap">
			<ShowText text={props.value} />
		</div>;
	} else if (props.t.kind == 'bond') {
		return <SimpleArticleCardById article_id={Number(props.value)} />;
	} else {
		return <>{props.value}</>;
	}
}

const ArrayField = (props: {field: Force.Field, validator: Validator}): JSX.Element => {
	const { field } = props;
	const [ value, setValue ] = useState<string>('');
	const [ is_valid, setIsValid ] = useState<undefined | string>(undefined);
	const { setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	if (editor_panel_data == null) { return <></>; }

	const show_list = (): JSX.Element => {
		let list = editor_panel_data.content[field.name];
		if (list instanceof Array) {
			return <div>
				{
					list.map((item, index) => {
						return <div key={index}>
							<span styleName="deleteButton" onClick={() => {
								const next_state = produce(editor_panel_data, nxt => {
									(nxt.content[field.name] as string[]).splice(index, 1);
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
		if (is_valid) {
			const next_state = produce(editor_panel_data, nxt => {
				if (editor_panel_data.content[field.name] instanceof Array) {
					(nxt.content[field.name] as string[]).push(value);
				} else {
					nxt.content[field.name] = [value];
				}
			});
			setEditorPanelData(next_state);
			setValue('');
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
		onChange: (evt: { target: { value: string } }) => {
			setValue(evt.target.value);
			props.validator.validate_basic_datatype(field.datatype.t, evt.target.value)
			.then(res => setIsValid(res));
		},
	};
	if (field.datatype.t.kind == 'text') {
		return <>
			{show_list()}
			<button onClick={push_data}>+</button>
			<textarea {...input_props} />
			{!is_valid && <InvalidMessage msg="不符力語言定義" />}
		</>;
	} else {
		return <>
			{show_list()}
			<input {...input_props} onKeyDown={on_enter} />
			{!is_valid && <InvalidMessage msg="不符力語言定義" />}
		</>;
	}
};

// @ts-ignore
const Field = (props: {field: Force.Field, validator: Validator}): JSX.Element => {
	const { field } = props;
	const { editor_panel_data } = EditorPanelState.useContainer();

	if (editor_panel_data == null) { return <></>; }

	const Wrap = (element: JSX.Element): JSX.Element => {
		return <div key={field.name} styleName="field">
			<label htmlFor={field.name}>
				{`${field.name}`}
				<span styleName="dataType">{`${Force.show_data_type(field.datatype)}`}</span>
			</label>
			{element}
		</div>;
	};
	if (field.datatype.kind == 'single') {
		return Wrap(<SingleField {...props} />);
	} else if (field.datatype.kind == 'optional') {
		// TODO: 改爲可選
		return Wrap(<SingleField {...props} />);
	} else if (field.datatype.kind == 'array') {
		return Wrap(<ArrayField {...props} />);
	}
};

function _EditorBody(props: RouteComponentProps): JSX.Element {
	const { closeEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const { handleSubmit } = useForm();
	const board = editor_panel_data!.board;
	const [ board_options, setBoardOptions ] = useState<BoardName[]>([{
		id: board.id,
		board_name: board.board_name,
	}]);
	useEffect(() => {
		API_FETCHER.queryBoardNameList()
		.then(data => unwrap(data))
		.then(data => setBoardOptions(data))
		.catch(err => console.log(err));
	}, []);
	const force = useMemo(
		() => Force.parse(board.force),
		[board]
	);
	const validator = new Validator(board.id);

	if (editor_panel_data == null) { return <></>; }

	// @ts-ignore
	const onSubmit = (data): void => {
		console.log(data);
		let category = force.categories.get(editor_panel_data.category!)!;
		// eslint-disable-next-line
		let content: { [index: string]: any } = {};
		for (let field of category.fields) {
			if (field.datatype.t.kind == 'number' || field.datatype.t.kind == 'bond') {
				if (field.datatype.kind == 'array') {
					content[field.name] = (editor_panel_data.content[field.name] as string[]).map(Number);
				} else {
					content[field.name] = Number(editor_panel_data.content[field.name]);
				}
			} else {
				content[field.name] = editor_panel_data.content[field.name];
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
			.then(() =>
				API_FETCHER.createArticle(
					board.id,
					category.name,
					editor_panel_data.title,
					JSON.stringify(content),
				)
			)
			.then(data => unwrap(data))
			.then(id => {
				toast('發文成功');
				closeEditorPanel();
				props.history.push(`/app/b/${editor_panel_data.board.board_name}/a/${id}`);
				setEditorPanelData(null);
			})
			.catch(err => {
				toastErr(err);
			});
	};

	return <div styleName="editorBody">
		<form onSubmit={handleSubmit(onSubmit)}>
			<div styleName="location">
				<select required
					styleName="board"
					value={board.id}
					onChange={(evt) => {
						API_FETCHER.queryBoardById(parseInt(evt.target.value))
						.then(data => unwrap(data))
						.then(board => setEditorPanelData({...editor_panel_data, board, category: '' }))
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
					styleName="category"
					value={editor_panel_data.category}
					onChange={(evt) => {
						let content: {[index: string]: string} = {};
						let category = force.categories.get(evt.target.value)!;
						for (let field of category.fields) {
							content[field.name] = '';
						}
						setEditorPanelData({ ...editor_panel_data, content, category: evt.target.value });
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
				styleName="articleTitle"
				placeholder="文章標題"
				name="title"
				onChange={(evt) => {
					setEditorPanelData({ ...editor_panel_data, title: evt.target.value });
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
					return <div styleName="fields">{input_fields}</div>;
				})()
			}
			<button type="submit">發佈文章</button>
		</form>
	</div>;
}

const EditorBody = withRouter(_EditorBody);
export { EditorPanel };