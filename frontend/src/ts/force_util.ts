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

export type Content = { [index: string]: string };

export enum TranslateKind {
	Perfect, // 完美對應
	Shrink,  // 舊版的多個欄位被塞進新版的一個多行文字類型欄位
	NotFit,  // 新版不存在任何一個多行文字類型的欄位，舊版的多餘欄位不知道怎麽塞哪裏纔好
}

export type TranslateStrategy = {
	kind: TranslateKind.Perfect
} | {
	kind: TranslateKind.Shrink,
	from_fields: force.Field[],
	to_field: force.Field
} | {
	kind: TranslateKind.NotFit,
	not_fit_fields: force.Field[],
};

export type TranslateResult = {
	content: Content,
	strategy: TranslateStrategy
};
export function get_field_name(field: force.Field): string {
	if (field.name.length == 0) {
		return '#預設#';
	} else {
		return field.name;
	}
};

export function translate(
	old_fields: force.Field[],
	new_fields: force.Field[],
	content: Content
): TranslateResult {
	let new_content: Content = create_new_content(new_fields);
	let not_fit_fields = [];
	for (let old_field of old_fields) {
		let ok = false;
		for (let new_field of new_fields) {
			// TODO: 若舊欄位是單行文字，新欄位是多行文字，也要可以轉換
			if (old_field.kind == new_field.kind && old_field.name == new_field.name) {
				ok = true;
				new_content[old_field.name] = content[old_field.name];
				break;
			}
		}
		// 如果沒有對應的新欄位，且該欄位非空
		if (!ok && content[old_field.name].length != 0) {
			not_fit_fields.push(old_field);
		}
	}
	// 沒有無法對應的欄位，完美轉換
	if (not_fit_fields.length == 0) {
		return { content: new_content, strategy: { kind: TranslateKind.Perfect } };
	}

	// 找新欄位裡的多行文字，優先找還沒被塞值的
	let to_field = new_fields.find(field => field.kind == force.FieldKind.MultiLine && new_content[field.name].length == 0);
	if (to_field == undefined) {
		to_field = new_fields.find(field => field.kind == force.FieldKind.MultiLine);
	}

	// 新欄位裡完全沒有多行文本，放棄
	if (to_field == undefined) {
		return {
			content: new_content,
			strategy: {
				kind: TranslateKind.NotFit,
				not_fit_fields: not_fit_fields,
			}
		};
	}

	// 把舊欄位不能對應的東西都塞進 to_field
	for (let field of not_fit_fields) {
		new_content[to_field.name] += `\n* * * * * * * ${get_field_name(field)} * * * * * * *\n`;
		new_content[to_field.name] += content[field.name];
	}

	return {
		content: new_content,
		strategy: {
			kind: TranslateKind.Shrink,
			from_fields: not_fit_fields,
			to_field
		}
	};
}

// 創造一個符合力語言型別的空實例
export function create_new_content(fields: force.Field[]): Content {
	let content: { [index: string]: string } = {};
	for (let field of fields) {
		if (field.kind == force.FieldKind.Number) {
			content[field.name] = '0';
		} else {
			content[field.name] = '';
		}
	}
	return content;
}

export function equal_fields(x: force.Field[], y: force.Field[]): boolean {
	if (x.length != y.length) {
		return false;
	}
	for (let i = 0; i < x.length; i++) {
		if (x[i].kind != y[i].kind || x[i].name != y[i].name) {
			return false;
		}
	}
	return true;
}