import { ValidatorTrait, VALIDATE_INFO } from './validate';
import { Bondee } from './defs';
import { parse_category } from './parser';

class Validator extends ValidatorTrait {
	async validate_bondee(_bondee: Bondee, _data: any): Promise<undefined | string> {
		return undefined;
	}
}

const validator = new Validator();

test('驗證單行', async () => {
	const source = '測試 {單行 文字}';
	const category = parse_category(source);
	const data1 = { '文字': 'hihi' };
	const data2 = { '文字': 'hi\nhi' };
	expect(await validator.validate_category(category, data1)).toBe(undefined);
	expect(await validator.validate_category(category, data2)).toBe(VALIDATE_INFO.ONELINE_HAS_NEWLINE);
});

test('驗證數字', async () => {
	const source = '測試 {數字 數}';
	const category = parse_category(source);
	const data1 = { '數': 1 };
	const data2 = { '數': '1' };
	expect(await validator.validate_category(category, data1)).toBe(undefined);
	expect(await validator.validate_category(category, data2)).toBe(VALIDATE_INFO.JSON_TYPE_MISMATCH);
});

test('驗證正則', async () => {
	const source = '測試 {文本/^.{3,5}$/ 文字}';
	const category = parse_category(source);
	const data1 = { '文字': '12' };
	const data2 = { '文字': '1234' };
	const data3 = { '文字': '123456' };
	expect(await validator.validate_category(category, data1)).toBe(VALIDATE_INFO.REGEXP_FAIL);
	expect(await validator.validate_category(category, data2)).toBe(undefined);
	expect(await validator.validate_category(category, data3)).toBe(VALIDATE_INFO.REGEXP_FAIL);
});

test('驗證可選', async () => {
	const source = '測試 {數字 數?}';
	const category = parse_category(source);
	const data1 = { '數': 1 };
	const data2 = { '數': null };
	const data3 = {};
	const data4 = { '數': '1' };
	expect(await validator.validate_category(category, data1)).toBe(undefined);
	expect(await validator.validate_category(category, data2)).toBe(undefined);
	expect(await validator.validate_category(category, data3)).toBe(undefined);
	expect(await validator.validate_category(category, data4)).toBe(VALIDATE_INFO.JSON_TYPE_MISMATCH);
});

test('驗證陣列', async () => {
	const source = '測試 {數字 數[2~3]}';
	const category = parse_category(source);
	const data1 = { '數': 1 };
	const data2 = { '數': null };
	const data3 = {};
	const data4 = { '數': '1' };
	const data5 = { '數': [1] };
	const data6 = { '數': [1,2] };
	const data7 = { '數': [1,2,3] };
	const data8 = { '數': [1,2,3,4] };
	const data9 = { '數': [1,2,'3'] };
	expect(await validator.validate_category(category, data1)).toBe(VALIDATE_INFO.not_an_array(1));
	expect(await validator.validate_category(category, data2)).toBe(VALIDATE_INFO.not_an_array(null));
	expect(await validator.validate_category(category, data3)).toBe(VALIDATE_INFO.not_an_array(undefined));
	expect(await validator.validate_category(category, data4)).toBe(VALIDATE_INFO.not_an_array('a'));
	expect(await validator.validate_category(category, data5)).toBe(VALIDATE_INFO.array_length_out_of_range(2, 3, 1));
	expect(await validator.validate_category(category, data6)).toBe(undefined);
	expect(await validator.validate_category(category, data7)).toBe(undefined);
	expect(await validator.validate_category(category, data8)).toBe(VALIDATE_INFO.array_length_out_of_range(2, 3, 4));
	expect(await validator.validate_category(category, data9)).toBe(VALIDATE_INFO.array_element_fail(2, VALIDATE_INFO.JSON_TYPE_MISMATCH));
});