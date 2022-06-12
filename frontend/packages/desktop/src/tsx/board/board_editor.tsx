import * as React from 'react';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Board, BoardType } from '../../ts/api/api_trait';
import { UserState } from '../global_state/user';
import { useForm } from 'react-hook-form';
import { InvalidMessage } from '../components/invalid_message';

import style from '../../css/board/board_editor.module.css';
import { toastErr, useInputValue } from '../utils';
import produce from 'immer';

import { force } from '../../ts/api/api_trait';
import { show_datatype } from '../../ts/force_util';
import { ScalableInput } from '../components/scalable_input';

const FieldKind = force.FieldKind;
type Force = force.Force;

export function ForceEditor(props: { value: Force, setValue: React.Dispatch<React.SetStateAction<Force>> }): JSX.Element {
	const tag = useInputValue('');
	function onAddCategory(): void {
		props.setValue(produce(props.value, force => {
			force.categories.push({name: '新分類', fields: []});
		}));
	}
	function onRemoveCategory(category_id: number): () => void {
		return () => {
			props.setValue(produce(props.value, force => {
				force.categories.splice(category_id, 1);
			}));
		};
	}
	function onChangeCategory(category_id: number): (new_name: string) => void {
		return (new_name: string) => {
			props.setValue(produce(props.value, force => {
				force.categories[category_id].name = new_name;
			}));
		};
	}
	function onAddField(category_id: number): () => void {
		return () => {
			props.setValue(produce(props.value, force => {
				force.categories[category_id].fields.push({kind: FieldKind.MultiLine, name: '新欄位'});
			}));
		};
	}
	function onSelectFieldKind(category_id: number, field_id: number): (event: React.ChangeEvent<HTMLSelectElement>) => void {
		return (event: React.ChangeEvent<HTMLSelectElement>) => {
			const new_kind = event.target.value as force.FieldKind;
			props.setValue(produce(props.value, force => {
				force.categories[category_id].fields[field_id].kind = new_kind;
			}));
		};
	}
	function onRemoveField(category_id: number, field_id: number): () => void {
		return () => {
			props.setValue(produce(props.value, force => {
				force.categories[category_id].fields.splice(field_id, 1);
			}));
		};
	}
	function onChangeField(category_id: number, field_id: number): (new_name: string) => void {
		return (new_name: string) => {
			props.setValue(produce(props.value, force => {
				force.categories[category_id].fields[field_id].name = new_name;
			}));
		};
	}
	function onRemoveTag(tag_id: number): () => void {
		return () => {
			props.setValue(produce(props.value, force => {
				force.suggested_tags.splice(tag_id, 1);
			}));
		};
	}
	function onAddTag(): void {
		const new_tag = tag.input_props.value;
		if (new_tag.length == 0) {
			return;
		}
		if (props.value.suggested_tags.includes(new_tag)) {
			toastErr(`${new_tag} 標籤已經存在`);
			return;
		}
		props.setValue(produce(props.value, force => {
			force.suggested_tags.push(new_tag);
		}));
		tag.setValue('');
	}

	return <div>
		<button onClick={onAddCategory}>
			新增分類
		</button>
		<div className={style.categories}>
			{props.value.categories.map((category, cid) => {
				// category.name, field.name 可能暫時重複，故不適合當 key

				const is_repeat = (props.value.categories.filter(other_category => other_category.name == category.name).length > 1);
				return <div className={style.category} key={cid}>
					<span className={style.remove} onClick={onRemoveCategory(cid)}>✗</span>
					<span className={style.categoryName}>
						<ScalableInput onChange={onChangeCategory(cid)} value={category.name} />
					</span>
					{is_repeat ? <InvalidMessage msg="不允許同名分類" /> : <></>}
					<div>
						<button onClick={onAddField(cid)}>新增欄位</button>
					</div>
					<div className={style.fields}>
						{
							category.fields.map((field, fid) => {
								let kinds = [
									FieldKind.MultiLine,
									FieldKind.OneLine,
									FieldKind.Number,
								];
								const is_repeat = (category.fields.filter(other_field => other_field.name == field.name).length > 1);
								return <div className={style.field} key={fid}>
									<span className={style.remove} onClick={onRemoveField(cid, fid)}>✗</span>
									<span className={style.fieldName}>
										<ScalableInput onChange={onChangeField(cid, fid)} value={field.name} />
									</span>
									<select value={field.kind} onChange={onSelectFieldKind(cid, fid)}>
										{
											kinds.map(kind => <option key={kind} value={kind}>{show_datatype(kind)}</option>)
										}
									</select>
									{is_repeat ? <InvalidMessage msg="不允許同名欄位" /> : <></>}
								</div>;
							})
						}
					</div>
				</div>;
			})}
		</div>

		<div className={style.suggestedTags}>
			<div className={style.question}>建議鍵結標籤</div>
			<input {...tag.input_props} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
				if (e.key == 'Enter') {
					onAddTag();
				}
			}}/>
			<button onClick={onAddTag}>
				新增標籤
			</button>
			{
				props.value.suggested_tags.map((tag, tid) => {
					return <div key={tag}>
						<span className={style.remove} onClick={onRemoveTag(tid)}>✗</span>
						{tag}
					</div>;
				})
			}
		</div>
	</div>;
}

export enum BoardEditorKind {
	Create, Edit
}

export type BoardEditorData = {
	kind: BoardEditorKind.Create,
	party_id: number,
} | {
	kind: BoardEditorKind.Edit,
	board: Board
};

export function BoardEditor(props: {
	editor_data: BoardEditorData,
	board_type: BoardType,
	setVisible: Function
}): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [forceValue, setForceValue] = React.useState<Force>(
		props.editor_data.kind == BoardEditorKind.Create ?
			{ categories: [], suggested_tags: [] } :
			props.editor_data.board.force
	);

	const user_name: string = (user_state.login ? user_state.user_name : '');

	type CreateBoardInput = {
		board_name: string,
		title: string,
		detail: string,
	};

	const { register, handleSubmit, errors } = useForm<CreateBoardInput>({ mode: 'onBlur' });

	function onSubmit(data: CreateBoardInput): void {
		if (user_state.login) {
			const category_name_set = new Set<string>();

			let forceValueCopy = JSON.parse(JSON.stringify(forceValue)) as Force;

			for (let category of forceValueCopy.categories) {
				if (category_name_set.has(category.name)) {
					toastErr('不允許同名分類');
					return;
				}
				category_name_set.add(category.name);
				let field_name_set = new Set<string>();
				for (const field of category.fields) {
					if (field_name_set.has(field.name)) {
						toastErr('不允許同名欄位');
						return;
					}
					field_name_set.add(field.name);
				}
				// 若 fields 爲空，塞入一個多行文字的欄位
				if (category.fields.length == 0) {
					category.fields.push({name: '', kind: FieldKind.MultiLine});
				}
			}

			if (props.editor_data.kind == BoardEditorKind.Create) {
				API_FETCHER.boardQuery.createBoard({
					board_type: props.board_type,
					ruling_party_id: props.editor_data.party_id,
					force: forceValueCopy,
					...data
				})
					.then((res) => {
						unwrap(res);
						location.reload();
					})
					.catch(err => toastErr(err));
			} else if (props.editor_data.kind == BoardEditorKind.Edit) {
				API_FETCHER.boardQuery.updateBoard({
					force: forceValueCopy,
					title: data.title,
					detail: data.detail,
					id: props.editor_data.board.id
				})
					.then((res) => {
						unwrap(res);
						location.reload();
					})
					.catch(err => toastErr(err));
			} else {
				toastErr('Bug: 未窮盡 BoardEditorKind');
			}
		} else {
			toastErr('尚未登入');
		}
	}

	let name = '';
	let name_disabled = false;
	let title = '';
	let detail = '';
	if (props.board_type == BoardType.Personal) {
		name = user_name;
		name_disabled = true;
	} else if (props.editor_data.kind == BoardEditorKind.Edit) {
		name = props.editor_data.board.board_name;
		name_disabled = true;
		title = props.editor_data.board.title;
		detail = props.editor_data.board.detail;
	}

	return <div className={style.boardEditor}>
		<form>
			<div className={style.label}>看板名稱</div>
			<input name="board_name" placeholder="看板名稱"
				defaultValue={name}
				disabled={name_disabled}
				ref={register({ required: true })}
				autoFocus />
			{errors.board_name && <InvalidMessage msg="必填" />}
			<div className={style.label}>版主的話</div>
			<input name="title" placeholder="版主的話"
				defaultValue={title}
				ref={register} />
			<div className={style.label}>看板介紹</div>
			<textarea name="detail" placeholder="看板介紹"
				defaultValue={detail}
				ref={register} />
		</form>
		<div className={style.forceEditor}>
			<div className={style.forceEditorLeft}>
				<div>看板定義</div>
				<ForceEditor value={forceValue} setValue={setForceValue} />
			</div>
			<div className={style.forceEditorRight}>
				<div>範本</div>
				<div className={style.forceExampleList}>
					{
						forceExamples.map(example => (
							<div className={style.forceExample} key={example.name} onClick={() => setForceValue(example.force)}>
								{example.name}
							</div>
						))
					}
				</div>
			</div>
		</div>
		<hr />
		<input type="submit" value="送出" onClick={handleSubmit(onSubmit)} />
		<button onClick={() => props.setVisible(false)}>取消</button>
	</div>;
}

type ForceExamples = {
	name: string,
	force: Force,
};

const forceExamples: ForceExamples[] = [];

forceExamples.push({
	name: '八尬',
	force: {
		categories: [
			{
				name: '新聞',
				fields: [
					{
						name: '媒體',
						kind: FieldKind.OneLine
					},
					{
						name: '記者',
						kind: FieldKind.OneLine
					},
					{
						name: '內文',
						kind: FieldKind.MultiLine
					},
					{
						name: '超鏈結',
						kind: FieldKind.OneLine
					},
					{
						name: '備註',
						kind: FieldKind.MultiLine
					},
				]
			},
			{
				name: '問卦',
				fields: []
			},
			{
				name: '回覆',
				fields: []
			},
		],
		suggested_tags: ['贊同', '反對']
	},
});