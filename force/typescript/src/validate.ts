import { Bondee, DataType, Category } from './defs';

export abstract class ValidatorTrait {
	abstract validate_bondee(bondee: Bondee, data: any): boolean;
	validate_number(data: any): boolean {
		if (typeof data == 'number') {
			return true;
		} else {
			return false;
		}
	}
	validate_datatype(datatype: DataType, data: any): boolean {
		if (datatype.kind == 'number') {
			return this.validate_number(data);
		} else if (datatype.kind == 'one_line' && typeof data == 'string') {
			return data.search('\n') == -1;
		} else if (datatype.kind == 'text' && typeof data == 'string') {
			if (datatype.regex) {
				return datatype.regex.test(data);
			} else {
				return true;
			}
		} else if (datatype.kind == 'bond') {
			return this.validate_bondee(datatype.bondee, data);
		} else {
			return false;
		}
	}
	validate_category(category: Category, data: any): boolean {
		if (data == null || typeof data != 'object') {
			return false;
		}
		for (let field of category.fields) {
			if (!this.validate_datatype(field.datatype, data[field.name])) {
				return false;
			}
		}
		return true;
	}
}