import { getGraphQLClient } from './api';
import { EditorPanelData, Transfuse } from '../tsx/global_state';
import { Article } from '../tsx/board_switch';

export type Category = {
	name: string,
	transfusable: boolean,
	is_question: boolean,
	show_in_list: boolean,
	rootable: boolean,
	threshold_to_post: {
		bond_energy: number,
		position: number
	},
	attached_to: string[],
	structure: { col_name: string, col_type: string, restriction: string }[],
};

export async function fetchCategories(board_name: string): Promise<Category[]> {
	// TODO: 快取?
	const graphQLClient = getGraphQLClient();
	const query = `
			query Categories($board_name: String!) {
				board(name: $board_name) {
					categories {
						body
					}
				}
			}
		`;
	let bodies: { board: { categories: { body: string }[] } } = await graphQLClient.request(query, {
		board_name
	});
	let ret: Category[] = bodies.board.categories.map(c => JSON.parse(c.body));
	return ret.filter(c => c.name != '留言');
}

export function checkCanAttach(cat: Category, attached_to: Category[] | string[]): boolean {
	if (attached_to.length == 0 && !cat.rootable) {
		return false;
	} else if (cat.name == '留言') {
		// NOTE: 留言使用不同的界面來發佈
		return false;
	} else {
		// 必需可以指向 attached_to 的每一種
		for (let c of attached_to) {
			let name = typeof(c) == 'string' ? c : c.name;
			if (cat.attached_to.indexOf(name) == -1) {
				return false;
			}
		}
		return true;
	}
}

export function checkCanReply(
	data: EditorPanelData | null,
	target: Article,
	transfuse: Transfuse
): boolean {
	if (data) {
		// 有正在發的文
		if (target.board.boardName != data.board_name) {
			// 檢查這個鍵結是否跨板
			return false;
		} else if (typeof data.root_id != 'undefined' && data.root_id != target.rootId) {
			// 檢查這個鍵結是否跨主題
			return false;
		} else if (transfuse != 0 && !data.cur_category.transfusable) {
			// 檢查有無違反輸能規則
			return false;
		} else {
			// 檢查這個鍵結是否已存在
			for (let e of data.edges) {
				if (e.article_id == target.id) {
					return false;
				}
			}
			// 檢查有無違反鍵結規則
			return checkCanAttach(data.cur_category, [target.category]);
		}
	} else {
		// TODO: 雖然沒有正在發文，但也有可能本板所有分類都不可用，不可單單回一個 true
		return true;
	}
}


export function idToCode(id: number): string {
	let bytes: number[] = Array(6).fill(0);
	let index = 0;
	while (id > 0) {
		let byte = id & 0xff;
		bytes[index++] = byte;
		id = (id - byte) / 256;
	}
	let s = bytes.map(n => String.fromCharCode(n)).join('');
	return btoa(s);
}

export function codeToId(code: string): number {
	let id = 0;
	let bytes_str = atob(code);
	for (let i = bytes_str.length - 1; i >= 0; i--) {
		let byte = bytes_str.charCodeAt(i);
		id = id * 256 + byte;
	}
	return id;
}

export function genReplyTitle(title: string): string {
	let match = title.match(/^ *Re: *(.*)/);
	if (match) {
		title = match[1];
	}
	return `Re: ${title}`;
}