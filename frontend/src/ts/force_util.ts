import { Category, Force } from '../../../force/typescript/index';

// 取得一個力語言定義中所有屬於 family 分類族的分類
export function get_family_members(force: Force, family: string): string[] {
	const ret = force!.families.get(family);
	if (ret == undefined) {
		return [];
	}
	return ret;
}

// 取得一個力語言定義中所有不屬於 family 分類族的分類
export function get_non_family_members(force: Force, family: string): string[] {
	const members = get_family_members(force, family);
	let non_members = [];
	for (let [name, _value] of force!.categories.entries()) {
		if (!members.includes(name)) {
			non_members.push(name);
		}
	}
	return non_members;
}

type Bond = {
	target_article: string,
	energy: string,
	tag: string
};

export function new_bond(id: string = ''): Bond {
	return {
		target_article: id,
		energy: '0',
		tag: ''
	};
}

// 創造一個符合力語言型別的空實例
// eslint-disable-next-line
export function new_content(category: Category): { [index: string]: any } {
// eslint-disable-next-line
	let content: { [index: string]: any } = {};
	for (let field of category.fields) {
		if (field.datatype.kind == 'array') {
			if (field.datatype.t.kind == 'bond') {
				content[field.name] = {
					confirmed: [],
					candidate: new_bond()
				};
			} else {
				content[field.name] = {
					confirmed: [],
					candidate: ''
				};
			}
		} else if (field.datatype.t.kind == 'bond') {
			content[field.name] = new_bond();
		} else {
			content[field.name] = '';
		}
	}
	console.log(`new_content = ${JSON.stringify(content, null, 2)}`);
	return content;
}

export const SATELLITE = '衛星';

export function get_satellite_members(force: Force): string[] {
	return get_family_members(force, '衛星');
}

export function get_main_members(force: Force): string[] {
	return get_non_family_members(force, '衛星');
}