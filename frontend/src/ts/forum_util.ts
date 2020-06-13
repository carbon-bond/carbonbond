import { ajaxOperation } from './api';
import { EditorPanelData, Transfuse } from '../tsx/global_state';
import { Article, ArticleMeta } from '../tsx/board_switch';

export enum FieldType {
	Text = 'Text',
	Line = 'Line',
	Int = 'Int',
	Rating = 'Rating'
}

export type CategoryBody = {
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
	structure: { name: string, type: string, restriction: string }[],
};

export function getArticleCategory(article: Article | ArticleMeta): CategoryBody {
	// console.log('getArticleCategory');
	// console.log(JSON.parse(article.category.body));
	return JSON.parse(article.category.body);
}

export async function fetchCategories(board_name: string): Promise<CategoryBody[]> {
	// TODO: 快取?
	let bodies = await ajaxOperation.CategoriesOfBoard({ board_name });
	let ret: CategoryBody[] = bodies.board.categories.map(c => JSON.parse(c.body));
	return ret.filter(c => c.name != '留言');
}

export function checkCanAttach(
	category: CategoryBody,
	attached_to: CategoryBody[] | string[]
): boolean {
	if (attached_to.length == 0 && !category.rootable) {
		return false;
	} else if (category.name == '留言') {
		// NOTE: 留言使用不同的界面來發佈
		return false;
	} else {
		// 必須可以指向 attached_to 的每一種
		for (let c of attached_to) {
			let name = typeof(c) == 'string' ? c : c.name;
			if (!category.attached_to.includes(name)) {
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
			return checkCanAttach(data.cur_category, [getArticleCategory(target)]);
		}
	} else {
		// TODO: 雖然沒有正在發文，但也有可能本板所有分類都不可用，不可單單回一個 true
		return true;
	}
}

export function genReplyTitle(title: string): string {
	let match = title.match(/^ *Re: *(.*)/);
	if (match) {
		title = match[1];
	}
	return `Re: ${title}`;
}