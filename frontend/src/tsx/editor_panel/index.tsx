import * as React from 'react';
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


import '../../css/bottom_panel/bottom_panel.css';
import '../../css/bottom_panel/editor.css';

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

type OpType = { label: string, value: number };

// @ts-ignore
const Field = (props: {field: Force.Field, validator: Validator, register}): JSX.Element => {
	const { field, validator, register } = props;
	const Wrap = (element: JSX.Element): JSX.Element => {
		return <div key={field.name} styleName="field">
			<label htmlFor={field.name}>{field.name}</label>
			{element}
		</div>;
	};
	const input_props = {
		placeholder: field.name,
		name: `content.${field.name}`,
		ref: register({
			required: true,
			validate: (data: string) => {
				return validator.validate_datatype(field.datatype, data);
			}
		}),
		id: field.name
	};
	if (field.datatype.kind == 'text') {
		return Wrap( <textarea {...input_props} /> );
	} else if (field.datatype.kind == 'number') {
		return Wrap( <input type="number" {...input_props} /> );
	} else {
		return Wrap( <input {...input_props} /> );
	}
};

function _EditorBody(props: RouteComponentProps): JSX.Element {
	const { closeEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const { register, handleSubmit } = useForm();
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
		for (let field of category.fields) {
			if (field.datatype.kind == 'number') {
				data.content[field.name] = Number(data.content[field.name]);
			}
		}
		API_FETCHER.createArticle(
			parseInt(data.board_id),
			data.category_name,
			data.title,
			JSON.stringify(data.content),
		)
			.then(data => unwrap(data))
			.then(id => {
				toast('發文成功');
				closeEditorPanel();
				props.history.push(`/app/b/${editor_panel_data.board.board_name}/a/${id}`);
				setEditorPanelData(null);
			})
			.catch(err => {
				toast.error(err);
			});
	};

	return <div styleName="editorBody">
		<form onSubmit={handleSubmit(onSubmit)}>
			<div styleName="location">
				<select required
					styleName="board"
					name="board_id"
					value={board.id}
					ref={register()}
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
					name="category_name"
					ref={register()}
					onChange={(evt) => {
						setEditorPanelData({ ...editor_panel_data, category: evt.target.value });
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
				ref={register()}
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
						input_fields.push(<Field validator={validator} key={field.name} field={field} register={register} />);
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