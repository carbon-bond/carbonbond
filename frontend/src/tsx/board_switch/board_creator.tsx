import * as React from 'react';
import { API_FETCHER } from '../../ts/api/api';
import { BoardType } from '../../ts/api/api_trait';
import { UserState } from '../global_state/user';
import { useForm } from 'react-hook-form';
import { History } from 'history';
import { ModalButton, ModalWindow } from '../components/modal_window';
import { InvalidMessage } from '../components/invalid_message';
import { parse } from '../../../../force/typescript/index';

import style from '../../css/board_switch/board_creator.module.css';
import { toastErr } from '../utils';

export function BoardCreator(props: { board_type: string, party_id: number, visible: boolean, setVisible: Function, history: History }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [forceValue, setForceValue] = React.useState<string>('');

	const user_name: string = (user_state.login ? user_state.user_name : '');

	type CreateBoardInput = {
		board_name: string,
		title: string,
		detail: string,
		force: string,
	};

	const { register, handleSubmit, errors } = useForm<CreateBoardInput>({ mode: 'onBlur' });

	function onSubmit(data: CreateBoardInput): void {
		if (user_state.login) {
			API_FETCHER.boardQuery.createBoard({
				board_type: props.board_type,
				ruling_party_id: props.party_id,
				...data
			})
				.then(() => props.history.go(0))
				.catch(err => toastErr(err));
		}
	}

	type ForceExample = {
		name: string,
		force: string[],
	};

	let forceExamples: ForceExample[] = [];

	forceExamples.push({
		name: '八尬',
		force: [
			'新聞 {',
			'    單行 媒體',
			'    單行 記者',
			'    文本 內文',
			'    單行 超鏈接',
			'    文本 備註',
			'}',
			'問卦 {',
			'    文本/.{1,}/ 內文',
			'}',
			'解答 {',
			'    鍵結[問卦,留言] 問題',
			'    文本 內文',
			'}',
			'留言 {',
			'    鍵結[*] 本體',
			'    文本/.{1,256}/ 內文',
			'}',
			'回覆 {',
			'    鍵結[*] 原文',
			'    文本 內文',
			'}'
		],
	});

	function getBody(): JSX.Element {
		return <div className={style.editModal}>
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
						<div>力語言</div>
						<textarea name="force" placeholder="力語言（定義看板分類、鍵結規則）" ref={register({
							validate: (value) => {
								try {
									parse(value);
									return true;
								} catch (err) {
									console.log(err);
									return false;
								}
							}
						})} value={forceValue} onChange={e => setForceValue(e.target.value)} />
						{errors.force && <InvalidMessage msg="力語言語法錯誤" />}
					</div>
					<div className={style.forceEditorRight}>
						<div>範本</div>
						<div className={style.forceExampleList}>
							{
								forceExamples.map(example => (
									<div className={style.forceExample} key={example.name} onClick={() => setForceValue(example.force.join('\n'))}>
										{example.name}
									</div>
								))
							}
						</div>
					</div>
				</div>
				<input type="submit" value="確認" />
			</form>
		</div>;
	}

	let buttons: ModalButton[] = [];

	return <ModalWindow
		title={props.board_type == BoardType.General ? '🏂 創立看板' : '🔨 創立個人看板'}
		body={getBody()}
		buttons={buttons}
		visible={props.visible}
		setVisible={props.setVisible}
	/>;
}