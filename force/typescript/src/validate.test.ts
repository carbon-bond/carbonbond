import { ValidatorTrait } from './validate';
import { Bondee } from './defs';
import { parse_category } from './parser';

class Validator extends ValidatorTrait {
	validate_bondee(_bondee: Bondee, _data: any): boolean {
		return true;
	}
}

const validator = new Validator();

test('驗證單行', () => {
	const source = '測試 {單行 文字}';
	const category = parse_category(source);
	const data1 = { '文字': 'hihi' };
	const data2 = { '文字': 'hi\nhi' };
	expect(validator.validate_category(category, data1)).toBe(true);
	expect(validator.validate_category(category, data2)).toBe(false);
});

test('驗證數字', () => {
	const source = '測試 {數字 數}';
	const category = parse_category(source);
	const data1 = { '數': 1 };
	const data2 = { '數': '1' };
	expect(validator.validate_category(category, data1)).toBe(true);
	expect(validator.validate_category(category, data2)).toBe(false);
});

test('驗證正則', () => {
	const source = '測試 {文本/^.{3,5}$/ 文字}';
	const category = parse_category(source);
	const data1 = { '文字': '12' };
	const data2 = { '文字': '1234' };
	const data3 = { '文字': '123456' };
	expect(validator.validate_category(category, data1)).toBe(false);
	expect(validator.validate_category(category, data2)).toBe(true);
	expect(validator.validate_category(category, data3)).toBe(false);
});