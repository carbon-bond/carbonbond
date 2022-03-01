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
