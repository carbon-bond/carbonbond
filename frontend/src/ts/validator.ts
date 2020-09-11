import * as force from 'force';

export class Validator extends force.ValidatorTrait {
	board_id: number;
	constructor(board_id: number) {
		super();
		this.board_id = board_id;
	}
	// eslint-disable-next-line
	validate_bondee(_bondee: force.Bondee, _data: any): boolean {
		return true;
	}
	// eslint-disable-next-line
	validate_number(data: any): boolean {
		console.log(`${data} 是數字？`);
		const n = Number(data);
		return !isNaN(n) && Number.isInteger(n);
	}
}