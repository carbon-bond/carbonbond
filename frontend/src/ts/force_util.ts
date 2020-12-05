import { Force } from 'force';

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

export function get_small_members(force: Force): string[] {
	return get_family_members(force, '小的');
}

export function get_big_members(force: Force): string[] {
	return get_non_family_members(force, '小的');
}

export const SMALL = '小的';