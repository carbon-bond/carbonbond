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
}