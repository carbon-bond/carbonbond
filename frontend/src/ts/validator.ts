import * as force from '../../../force/typescript/index';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { get_force } from '../ts/cache';

export class Validator extends force.ValidatorTrait {
	board_id: number;
	constructor(board_id: number) {
		super();
		this.board_id = board_id;
	}
	// eslint-disable-next-line
	async validate_article_id(bondee: force.Bondee, data: any): Promise<string | undefined> {
		if (data.target_article.length == 0) {
			return '文章代碼不可為空';
		}
		const article_id = Number(data.target_article);
		if (isNaN(article_id) || !Number.isInteger(article_id)) {
			return '文章代碼必須是整數';
		}
		let meta, force;
		try {
			force = await get_force(this.board_id);
			meta = unwrap(await API_FETCHER.queryArticleMeta(article_id));
		} catch {
			return '非預期的網路錯誤';
		}
		if (meta.board_id != this.board_id) { return '只能鍵結到同看板文章'; }
		if (bondee.kind == 'all') {
			return undefined;
		} else if (bondee.category.includes(meta.category_name)) {
			// 檢查分類
			return undefined;
		} else {
			// 檢查分類族
			for (let f of bondee.family) {
				if (force.families.get(f)!.includes(meta.category_name)) {
					return undefined;
				}
			}
		}
		return '無法指向該文章分類';
	}

	// eslint-disable-next-line
	validate_energy(data: any): string | undefined {
		if (data.energy == '1' || data.energy == '0' || data.energy == '-1') {
			return undefined;
		} else {
			return '鍵能異常';
		}
	}
	// eslint-disable-next-line
	validate_tag(data: any): string | undefined {
		if (data.tag.length > 5) {
			return '標籤不得超過五個字';
		} else if (data.tag.trim() != data.tag) {
			return '標籤前後不得有空白';
		} else {
			return undefined;
		}
	}
	// eslint-disable-next-line
	async validate_bondee(bondee: force.Bondee, data: any): Promise<string | undefined> {
		let messages = [
			await this.validate_article_id(bondee, data),
			this.validate_energy(data),
			this.validate_tag(data),
		];
		let s = messages.filter(m => m != undefined).join(', ');
		return s == '' ? undefined : s;
	}
	// eslint-disable-next-line
	async validate_number(data: any): Promise<string | undefined> {
		if (data.length == 0) { return '不可為空'; }
		const n = Number(data);
		if (isNaN(n)) {
			return '無法解析為數字';
		} else if (!Number.isInteger(n)) {
			return '必須是整數';
		}
		return undefined;
	}
}