export interface Tag {
	name: string;
}

export type Bondee = {
	kind: 'choices',
	category: string[],
	family: string[]
} | { kind: 'all' };

export function show_bondee(bondee: Bondee): string {
	if (bondee.kind == 'all') {
		return '[*]';
	} else if (bondee.kind == 'choices') {
		return `[${bondee.family.map(c => '@' + c).concat(bondee.category).join(', ')}]`;
	}
	throw 'impossible code';
}

export type BasicDataType = {
	kind: 'bond',
	bondee: Bondee
} | {
	kind: 'tagged_bond',
	bondee: Bondee,
	tags: Tag[]
} | {
	kind: 'one_line'
} | {
	kind: 'text',
	regex: RegExp | undefined
} | {
	kind: 'number'
};

export function show_basic_data_type(t: BasicDataType): string {
	if (t.kind == 'bond') {
		return `鍵結${show_bondee(t.bondee)}`;
	} else if (t.kind == 'tagged_bond') {
		return '帶籤鍵結(TODO)';
	} else if (t.kind == 'one_line') {
		return '單行';
	} else if (t.kind == 'text') {
		return `文本${t.regex == undefined ? '' : t.regex.toString()}`;
	} else if (t.kind == 'number') {
		return '數字';
	}
	throw 'impossible code';
}

export type DataType = {
	kind: 'single',
	t: BasicDataType
} | {
	kind: 'optional',
	t: BasicDataType
} | {
	kind: 'array',
	t: BasicDataType,
	min: number,
	max: number
};

export function show_data_type(data_type: DataType): string {
	if (data_type.kind == 'single') {
		return show_basic_data_type(data_type.t);
	} else if (data_type.kind == 'optional') {
		return show_basic_data_type(data_type.t) + ' ‧ 可選';
	} else if (data_type.kind == 'array') {
		return show_basic_data_type(data_type.t) + ` ‧ 陣列[${data_type.min} ~ ${data_type.max}]`;
	}
	throw 'impossible code';
}

export interface Field {
	datatype: DataType,
	name: string
}

export interface Category {
	name: string,
	family: string[],
	fields: Field[]
}

export type Categories = Map<string, Category>;

export interface Force {
	families: Map<string, string[]>,
	categories: Categories
}
