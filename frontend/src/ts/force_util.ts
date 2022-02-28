import { Force } from '../../../force/typescript/index';
import { force } from './api/api_trait';

export function show_datatype(datatype: force.FieldKind): string {
	switch (datatype) {
		case force.FieldKind.MultiLine:
			return '多行文字';
		case force.FieldKind.OneLine:
			return '單行文字';
		case force.FieldKind.Number:
			return '數字';
	}
}

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
export function new_content(category: force.Category): { [index: string]: string } {
	let content: { [index: string]: string } = {};
	for (let field of category.fields) {
		if (field.kind == force.FieldKind.Number) {
			content[field.name] = '0';
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