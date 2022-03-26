import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import style from '../../css/header/search_bar.module.css';

export function SearchBar(props: { cur_board: string | null, hide_select_board?: boolean }): JSX.Element {
	let [content, setContent] = React.useState('');
	let [board, setBoard] = React.useState<string | null>(null);
	const navigate = useNavigate();
	function onSearch(board_name: string | null): void {
		if (content.length == 0) {
			return;
		}
		if (board_name) {
			console.log(`於看板 ${board_name} 搜 ${content}`);
			navigate(`/app/search?title=${content}&board=${board_name}`);
		} else {
			console.log(`全站搜 ${content}`);
			navigate(`/app/search?title=${content}`);
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
	return <div className={style.searchPart}>
		<input placeholder="搜尋"
			size={1}
			onChange={onChange} onKeyDown={onKeyDown} value={content} />
		{
			props.hide_select_board ? null : <select onChange={(evt) => {
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
							return <option value={props.cur_board}>
								{props.cur_board}
							</option>;
						}
					})()
				}
			</select>
		}
	</div>;
}