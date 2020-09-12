import * as force from 'force';
import { API_FETCHER, unwrap } from '../ts/api/api';

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
		const meta = unwrap(await API_FETCHER.queryArticleMeta(article_id));
		if (meta.board_id != this.board_id) { return false; }
		if (bondee.kind == 'all') {
			return true;
		} else {
			return bondee.choices.includes(meta.category_name);
		}
	}
	// eslint-disable-next-line
	async validate_number(data: any): Promise<boolean> {
		const n = Number(data);
		return !isNaN(n) && Number.isInteger(n);
	}
}