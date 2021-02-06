import { lexer } from './lexer';
import * as moo from 'moo';
import { Bondee, BasicDataType, DataType, Category, Categories, Force, Field } from './defs';

function non_expect(expect: string, fact: moo.Token): Error {
	return new Error(`預期 ${expect} ，但得到 ${JSON.stringify(fact)}`);
}

class SemanticError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SemanticError';
	}
}

function invalid_bond(categories: string[], families: string[]): SemanticError {
	let msg;
	if (families.length == 0) {
		msg = `不存在分類 [ ${categories} ]`;
	} else if (categories.length == 0) {
		msg = `不存在分類族 [ ${families.map(f => '@' + f)} ]`;
	} else {
		msg = `不存在分類 [ ${categories} ]
		以及分類族 [ ${families.map(f => '@' + f)} ]
`;
	}
	return new SemanticError(msg);
}

type Choice = {
	kind: 'category',
	name: string,
} | {
	kind: 'family',
	name: string,
};

export class Parser {
	source: string;
	tokens: moo.Token[];
	count: number;
	constructor(s: string) {
		this.source = s;
		this.tokens = [];
		this.count = 0;
		lexer.reset(this.source);
		while (true) {
			const token = lexer.next();
			if (token == undefined) {
				break;
			} else if (token.type == 'new_line' || token.type == 'whitespace') {
				continue;
			}
			this.tokens.push(token);
		}
	}
	is_end(): boolean {
		return this.tokens.length == this.count;
	}
	cur(): moo.Token {
		if (this.count == this.tokens.length) {
			throw new Error('已到 tokens 結尾');
		}
		return this.tokens[this.count];
	}
	advance(): void {
		this.count = Math.min(this.count + 1, this.tokens.length);
	}
	eat(expect: string): void {
		if (this.cur().type == expect) {
			this.advance();
		} else {
			throw non_expect(expect, this.cur());
		}
	}
	get_identifier(): string {
		if (this.cur().type == 'identifier') {
			const ret = this.cur().value;
			this.advance();
			return ret;
		} else {
			throw non_expect('identifier', this.cur());
		}
	}
	get_integer(): number {
		if (this.cur().type == 'integer') {
			const ret = this.cur().value;
			this.advance();
			return parseInt(ret);
		} else {
			throw non_expect('integer', this.cur());
		}
	}
	parse_choice(): Choice {
		switch (this.cur().type) {
			case 'at': {
				this.advance();
				const name = this.get_identifier();
				return { kind: 'family', name };
			}
			default: {
				const name = this.get_identifier();
				return { kind: 'category', name };
			}
		}
	}
	parse_choices(): Bondee {
		const category: string[] = [];
		const family: string[] = [];
		const choice = this.parse_choice();
		if (choice.kind == 'category') {
			category.push(choice.name);
		} else if (choice.kind == 'family'){
			family.push(choice.name);
		}
		while (true) {
			if (this.cur().type == 'right_square_bracket') {
				break;
			} else if (this.cur().type == 'comma') {
				this.advance();
				const choice = this.parse_choice();
				if (choice.kind == 'category') {
					category.push(choice.name);
				} else if (choice.kind == 'family'){
					family.push(choice.name);
				}
			} else {
				throw non_expect(', 或 ]', this.cur());
			}
		}
		return {
			kind: 'choices',
			category,
			family
		};
	}
	parse_bondee(): Bondee {
		this.eat('left_square_bracket');
		switch (this.cur().type) {
			case 'star': {
				this.advance();
				this.eat('right_square_bracket');
				return { kind: 'all' };
			}
			case 'identifier':
			case 'at': {
				let choices = this.parse_choices();
				this.eat('right_square_bracket');
				return choices;
			}
			default: {
				throw non_expect('* 或識別子', this.cur());
			}
		}
	}
	parse_datatype(): BasicDataType {
		switch (this.cur().type) {
			case 'number': {
				this.advance();
				return {kind: 'number'};
			}
			case 'one_line': {
				this.advance();
				return {kind: 'one_line'};
			}
			case 'text': {
				this.advance();
				if (this.cur().type == 'regex') {
					const regex = this.cur().value;
					this.advance();
					return {
						kind: 'text',
						regex,
					};
				} else {
					return {
						kind: 'text',
						regex: undefined
					};
				}
			}
			case 'bond': {
				this.advance();
				const bondee = this.parse_bondee();
				return {
					kind: 'bond',
					bondee
				};
			}
			default: {
				throw non_expect('型別', this.cur());
			}
		}
	}
	parse_family(): string[] {
		switch (this.cur().type)  {
			case 'at': {
				this.advance();
				this.eat('left_square_bracket');
				const name = this.get_identifier();
				const family = [name];
				while (true) {
					if (this.cur().type == 'right_square_bracket') {
						this.advance();
						break;
					} else {
						this.eat('comma');
						const name = this.get_identifier();
						family.push(name);
					}
				}
				return family;
			}
			default: {
				return [];
			}
		}
	}
	parse_field(): Field {
		const basic_datatype = this.parse_datatype();
		const name = this.get_identifier();
		const datatype = ((): DataType => {
			if (this.cur().type == 'question_mark') {
				this.advance();
				return {kind: 'optional', t: basic_datatype};
			} else if (this.cur().type == 'left_square_bracket') {
				this.advance();
				const min = this.get_integer();
				this.eat('tilde');
				const max = this.get_integer();
				this.eat('right_square_bracket');
				return {
					kind: 'array',
					t: basic_datatype,
					min, max,
				};
			} else {
				return {kind: 'single', t: basic_datatype};
			}
		})();
		return { name, datatype };
	}
	parse_category(): Category {
		// 讀取分類名稱
		const name = this.get_identifier();

		// 讀取分類族
		const family = this.parse_family();

		// 讀取各欄位資訊
		const fields = [];
		this.eat('left_curly_brace');

		while (true) {
			if (this.cur().type == 'right_curly_brace') {
				break;
			} else {
				fields.push(this.parse_field());
			}
		}
		this.eat('right_curly_brace');
		return {
			name,
			family,
			fields
		};
	}
	parse_categories(): Categories {
		let categories = new Map<string, Category>();
		while (true) {
			if (this.is_end()) {
				break;
			} else {
				const category = this.parse_category();
				categories.set(category.name, category);
			}
		}
		return categories;
	}
	parse(): Force {
		const categories = this.parse_categories();

		// 建造分類族雜湊表
		const families = new Map<string, string[]>();

		for (let [_key, category] of categories) {
			for (let family of category.family) {
				let f = families.get(family);
				if (f == undefined) {
					families.set(family, [category.name]);
				} else {
					f.push(category.name);
				}
			}
		}

		// 檢驗鍵結指向的分類跟分類族是否存在
		let not_found_categories = new Set<string>();
		let not_found_families = new Set<string>();

		for (let [_key, category] of categories) {
			for (let field of category.fields) {
				if (field.datatype.t.kind == 'bond') {
					const bondee = field.datatype.t.bondee;
					if (bondee.kind == 'choices') {
						for (let c of bondee.category) {
							if (categories.get(c) == undefined) {
								not_found_categories.add(c);
							}
						}
						for (let f of bondee.family) {
							if (families.get(f) == undefined) {
								not_found_families.add(f);
							}
						}
					}
				}
			}
		}

		if (not_found_categories.size > 0 || not_found_families.size > 0) {
			throw invalid_bond([...not_found_categories], [...not_found_families]);
		}

		return {
			families,
			categories
		};
	}
}

export function parse(source: string): Force {
	const parser = new Parser(source);
	return parser.parse();
}

export function parse_category(source: string): Category {
	const parser = new Parser(source);
	return parser.parse_category();
}