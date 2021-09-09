import { Bondee, BasicDataType, DataType, Category } from './defs';

export const VALIDATE_INFO = {
	ONELINE_HAS_NEWLINE: '單行不應含有換行',
	REGEXP_FAIL: '不符合正則表達式',
	JSON_TYPE_MISMATCH: '資料的型別不符',
	array_length_out_of_range: (min: number, max: number, length: number): string => {
		return `陣列範圍為 [${min}, ${max}] ，實際長度為 ${length}`;
	},
	array_element_fail: (index: number, element_info: string): string => {
		return `陣列中第 ${index} 元素有誤： ${element_info}`;
	},
	not_an_array: (data: any): string => {
		return `預期陣列，但得到 ${typeof data}`;
	}
};



export abstract class ValidatorTrait {
	abstract validate_bondee(bondee: Bondee, data: any): Promise<string | undefined>;
	async validate_number(data: any): Promise<string | undefined> {
		if (typeof data == 'number') {
			return undefined;
		} else {
			return VALIDATE_INFO.JSON_TYPE_MISMATCH;
		}
	}
	async validate_basic_datatype(datatype: BasicDataType, data: any): Promise<string | undefined> {
		if (datatype.kind == 'number') {
			return (await this.validate_number(data));
		} else if (datatype.kind == 'one_line' && typeof data == 'string') {
			if (data.search('\n') == -1) {
				return undefined;
			} else {
				return VALIDATE_INFO.ONELINE_HAS_NEWLINE;
			}
		} else if (datatype.kind == 'text' && typeof data == 'string') {
			if (datatype.regex) {
				let regex = new RegExp(datatype.regex, 'gs');
				let res = regex.test(data);
				return res ? undefined : VALIDATE_INFO.REGEXP_FAIL;
			} else {
				return undefined;
			}
		} else if (datatype.kind == 'bond') {
			return (await this.validate_bondee(datatype.bondee, data));
		} else {
			return VALIDATE_INFO.JSON_TYPE_MISMATCH;
		}
	}
	async validate_datatype(datatype: DataType, data: any): Promise<string | undefined> {
		if (datatype.kind == 'optional') {
			if (data == undefined || data == null) {
				return undefined;
			} else {
				return (await this.validate_basic_datatype(datatype.t, data));
			}
		} else if (datatype.kind == 'single') {
			return (await this.validate_basic_datatype(datatype.t, data));
		} else {
			if (Array.isArray(data)) {
				if (data.length < datatype.min || data.length > datatype.max) {
					return VALIDATE_INFO.array_length_out_of_range(datatype.min, datatype.max, data.length);
				}
				for (let [index, value] of data.entries()) {
					let element_info = (await this.validate_basic_datatype(datatype.t, value));
					if (element_info != undefined) {
						return VALIDATE_INFO.array_element_fail(index, element_info);
					}
				}
				return undefined;
			} else {
				// data 並非陣列
				return VALIDATE_INFO.not_an_array(data);
			}
		}
	}
	async validate_category(category: Category, data: any): Promise<undefined | string> {
		if (data == null || typeof data != 'object') {
			return VALIDATE_INFO.JSON_TYPE_MISMATCH;
		}
		// 回傳第一個錯誤
		for (let field of category.fields) {
			let res = (await this.validate_datatype(field.datatype, data[field.name]));
			if (res != undefined) {
				return res;
			}
		}
		return undefined;
	}
}