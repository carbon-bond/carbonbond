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

// 創造一個符合力語言型別的空實例
export function new_content(category: Category): { [index: string]: string | string[] } {
	let content: { [index: string]: string | string[] } = {};
	for (let field of category.fields) {
		if (field.datatype.kind == 'array') {
			content[field.name] = [];
		} else {
			content[field.name] = '';
		}
	}
	return content;
}

export const SATELLITE = '衛星';

export function get_satellite_members(force: Force): string[] {
	return get_family_members(force, '衛星');
}

export function get_main_members(force: Force): string[] {
	return get_non_family_members(force, '衛星');
}