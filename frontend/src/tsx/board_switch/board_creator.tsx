import * as React from 'react';
import { API_FETCHER } from '../../ts/api/api';
import { BoardType } from '../../ts/api/api_trait';
import { UserState } from '../global_state/user';
import { useForm } from 'react-hook-form';
import { History } from 'history';
import { InvalidMessage } from '../components/invalid_message';

import style from '../../css/board_switch/board_creator.module.css';
import { toastErr } from '../utils';
import produce from 'immer';

import { force } from '../../ts/api/api_trait';
import { show_datatype } from '../../ts/force_util';

const FieldKind = force.FieldKind;
type Force = force.Force;

// TODO: 編輯
export function ForceEditor(props: { value: Force, setValue: React.Dispatch<React.SetStateAction<Force>> }): JSX.Element {
	return <div>
		<h2>分類</h2>
		<div className={style.categories}>
			{props.value.categories.map((category, cid) => {
				return <div key={category.name}>
					<h3>{category.name}</h3>
					<div className={style.fields}>
						{
							category.fields.map((field, fid) => {
								let kinds = [
									FieldKind.MultiLine,
									FieldKind.OneLine,
									FieldKind.Number,
								];
								return <div key={field.name}>
									{field.name}
									<select value={field.kind} onChange={(evt) => {
										const new_kind = evt.target.value as force.FieldKind;
										props.setValue(produce(props.value, force => {
											force.categories[cid].fields[fid].kind = new_kind;
										}));
									}}>
										{
											kinds.map(kind => <option key={kind} value={kind}>{show_datatype(kind)}</option>)
										}
									</select>
								</div>;
							})
						}
						<button>新增欄位</button>
					</div>
				</div>;
			})}
			<button>新增分類</button>
		</div>

		<div>
			<h2>建議鍵結標籤</h2>
			{props.value.suggested_tags.map(tag => {
				return <div key={tag}>{tag}</div>;
			})}
			<input /><button>新增標籤</button>
		</div>
	</div>;
}

export function BoardCreator(props: { board_type: string, party_id: number, visible: boolean, setVisible: Function, history: History }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [forceValue, setForceValue] = React.useState<Force>({ categories: [], suggested_tags: [] });

	const user_name: string = (user_state.login ? user_state.user_name : '');

	type CreateBoardInput = {
		board_name: string,
		title: string,
		detail: string,
	};

	const { register, handleSubmit, errors } = useForm<CreateBoardInput>({ mode: 'onBlur' });

	function onSubmit(data: CreateBoardInput): void {
		if (user_state.login) {
			API_FETCHER.boardQuery.createBoard({
				board_type: props.board_type,
				ruling_party_id: props.party_id,
				force: forceValue,
				...data
			})
				.then(() => props.history.go(0))
				.catch(err => toastErr(err));
		}
	}

	if (props.visible) {
		return <div className={style.boardEditor}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div>看板名稱</div>
				<input name="board_name" placeholder="看板名稱" defaultValue={props.board_type == BoardType.Personal ? user_name : ''} disabled={props.board_type == BoardType.Personal} ref={register({ required: true })} autoFocus />
				{errors.board_name && <InvalidMessage msg="必填" />}
				<div>版主的話</div>
				<input name="title" placeholder="版主的話" ref={register} />
				<div>看板介紹</div>
				<textarea name="detail" placeholder="看板介紹" ref={register} />
				<div className={style.forceEditor}>
					<div className={style.forceEditorLeft}>
						<div>看板定義</div>
						<ForceEditor value={forceValue} setValue={setForceValue}/>
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
				<input type="submit" value="送出" />
				<button onClick={() => props.setVisible(false)}>取消</button>
			</form>
		</div>;
	} else {
		return <></>;
	}
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
						name: '超鏈接',
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