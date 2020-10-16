import * as React from 'react';
import { BoardName } from '../ts/api/api_trait';
import { History } from 'history';
import '../css/header.css';

export function SearchBar(props: { cur_board: BoardName | null, history: History }): JSX.Element {
	let [content, setContent] = React.useState('');
	let [board, setBoard] = React.useState<string | null>(null);
	function onSearch(board_name: string | null): void {
		if (board_name) {
			console.log(`於看板 ${board_name} 搜 ${content}`);
			props.history.push(`/app/search?title=${content}&board=${board_name}`);
		} else {
			console.log(`全站搜 ${content}`);
			props.history.push(`/app/search?title=${content}`);
		}
	}
	function onChange(evt: React.ChangeEvent<HTMLInputElement>): void {
		setContent(evt.target.value);
	}
	function onKeyDown(evt: React.KeyboardEvent): void {
		if (evt.key == 'Enter') {
			onSearch(board);
		}
	}
	return <div styleName="searchPart">
		<input placeholder="搜尋"
			onChange={onChange} onKeyDown={onKeyDown} value={content} />
		<select onChange={(evt) => {
			let name = evt.target.value;
			if (name.length == 0) {
				setBoard(null);
				onSearch(null);
			} else {
				setBoard(name);
				onSearch(name);
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