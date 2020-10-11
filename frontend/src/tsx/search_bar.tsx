import * as React from 'react';
import { BoardName } from '../ts/api/api_trait';
import { History } from 'history';
import '../css/header.css';

export function SearchBar(props: { cur_board: BoardName | null, history: History }): JSX.Element {
	let [content, setContent] = React.useState('');
	let [board, setBoard] = React.useState<string | null>(null);
	function onSearch(): void {
		if (board) {
			console.log(`於看板 ${board} 搜 ${content}`);
			props.history.push(`/app/search?content=${content}&board=${board}`);
		} else {
			console.log(`全站搜 ${content}`);
			props.history.push(`/app/search?content=${content}`);
		}
	}
	function onChange(evt: React.ChangeEvent<HTMLInputElement>): void {
		setContent(evt.target.value);
	}
	function onKeyDown(evt: React.KeyboardEvent): void {
		if (evt.key == 'Enter') {
			onSearch();
		}
	}
	return <div styleName="searchPart">
		<input placeholder="搜尋"
			onChange={onChange} onKeyDown={onKeyDown} value={content} />
		<select onChange={(evt) => {
			let name = evt.target.value;
			if (name.length == 0) {
				setBoard(null);
			} else {
				setBoard(name);
			}
		}}>
			<option value="">全站搜尋</option>
			{
				(() => {
					if (props.cur_board) {
						return <option value={props.cur_board.board_name}>
							{props.cur_board.board_name}
						</option>;
					}
				})()
			}
		</select>
	</div>;
}