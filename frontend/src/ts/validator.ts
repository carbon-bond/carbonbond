import * as force from 'force';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { get_force } from '../ts/cache';

export class Validator extends force.ValidatorTrait {
	board_id: number;
	constructor(board_id: number) {
		super();
		this.board_id = board_id;
	}
	// eslint-disable-next-line
	async validate_bondee(bondee: force.Bondee, data: any): Promise<boolean> {
		const article_id = Number(data);
		if (isNaN(article_id)) {
			return false;
		}
		let meta, force;
		try {
			force = await get_force(this.board_id);
			meta = unwrap(await API_FETCHER.queryArticleMeta(article_id));
		} catch {
			return false;
		}
		if (meta.board_id != this.board_id) { return false; }
		if (bondee.kind == 'all') {
			return true;
		} else if (bondee.category.includes(meta.category_name)) {
			// 檢查分類
			return true;
		} else {
			// 檢查分類族
			for (let f of bondee.family) {
				if (force.families.get(f)!.includes(meta.category_name)) {
					return true;
				}
			}
		}
		return false;
	}
	// eslint-disable-next-line
	async validate_number(data: any): Promise<boolean> {
		if (data.length == 0) { return false; }
		const n = Number(data);
		return !isNaN(n) && Number.isInteger(n);
	}
}