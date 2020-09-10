import { lexer } from './lexer';
import * as moo from 'moo';
import { Tag, Bondee, DataType, Category, Categories, Force } from './defs';

function non_expect(expect: string, fact: moo.Token): Error {
	return new Error(`預期 ${expect} ，但得到 ${JSON.stringify(fact)}`);
}

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
	parse_tags(): Tag[] {
		let tags = [];
		this.eat('left_curly_brace');
		while (true) {
			if (this.cur().type == 'right_curly_brace') {
				this.advance();
				break;
			} else {
				const name = this.get_identifier();
				tags.push({ name });
				this.eat('left_curly_brace');
				while (this.cur().type != 'right_curly_brace') {
					this.advance();
				}
				this.eat('right_curly_brace');
			}
		}
		return tags;
	}
	parse_bondee(): Bondee {
		this.eat('left_square_bracket');
		switch (this.cur().type) {
			case 'star': {
				this.advance();
				this.eat('right_square_bracket');
				return { kind: 'all' };
			}
			case 'identifier': {
				let choices = [this.cur().value];
				this.advance();
				this.cur().type = this.cur().type; // 無意義，只是讓 typescript 不要報錯
				while (true) {
					if (this.cur().type == 'right_square_bracket') {
						break;
					} else {
						this.eat('comma');
						const name = this.get_identifier();
						choices.push(name);
					}
				}
				this.eat('right_square_bracket');
				return {
					kind: 'choices',
					choices
				};
			}
			default: {
				throw non_expect('* 或識別子', this.cur());
			}
		}
	}
	parse_datatype(): DataType {
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
						regex: new RegExp(regex),
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
			case 'tagged_bond': {
				this.advance();
				const bondee = this.parse_bondee();
				const tags = this.parse_tags();
				return {
					kind: 'tagged_bond',
					bondee,
					tags
				};
			}
			default: {
				throw non_expect('型別', this.cur());
			}
		}
	}
	parse_category(): Category {
		const name = this.get_identifier();
		let category: Category = {
			name,
			fields: []
		};
		this.eat('left_curly_brace');
		while (true) {
			if (this.cur().type == 'right_curly_brace') {
				break;
			} else {
				const datatype = this.parse_datatype();
				const name = this.get_identifier();
				category.fields.push({ datatype, name });
			}
		}
		this.eat('right_curly_brace');
		return category;
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
		return {
			categories: this.parse_categories()
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