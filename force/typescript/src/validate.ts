import { Bondee, DataType, Category } from './defs';

export abstract class ValidatorTrait {
	abstract async  validate_bondee(bondee: Bondee, data: any): Promise<boolean>;
	async validate_number(data: any): Promise<boolean> {
		if (typeof data == 'number') {
			return true;
		} else {
			return false;
		}
	}
	async validate_datatype(datatype: DataType, data: any): Promise<boolean> {
		if (datatype.kind == 'number') {
			return (await this.validate_number(data));
		} else if (datatype.kind == 'one_line' && typeof data == 'string') {
			return data.search('\n') == -1;
		} else if (datatype.kind == 'text' && typeof data == 'string') {
			if (datatype.regex) {
				return datatype.regex.test(data);
			} else {
				return true;
			}
		} else if (datatype.kind == 'bond' || datatype.kind == 'tagged_bond') {
			return (await this.validate_bondee(datatype.bondee, data));
		} else {
			return false;
		}
	}
	async validate_category(category: Category, data: any): Promise<boolean> {
		if (data == null || typeof data != 'object') {
			return false;
		}
		// 改成 promise.all
		for (let field of category.fields) {
			if (!(await this.validate_datatype(field.datatype, data[field.name]))) {
				return false;
			}
		}
		return true;
	}
}