import * as defs from './defs';

test('bondee 字串轉換', () => {
	expect(defs.show_bondee({kind: 'all'})).toBe('[*]');
	expect(defs.show_bondee({
		kind: 'choices',
		family: ['甲', '乙', '丙'],
		category: ['a','b','c'],
	})).toBe('[@甲, @乙, @丙, a, b, c]');
});

test('基礎型別字串轉換', () => {
	expect(defs.show_basic_data_type({
		kind: 'bond',
		bondee: {kind: 'all'}
	})).toBe('鍵結[*]');
	expect(defs.show_basic_data_type({
		kind: 'one_line',
	})).toBe('單行');
	expect(defs.show_basic_data_type({
		kind: 'text',
		regex: undefined
	})).toBe('文本');
	expect(defs.show_basic_data_type({
		kind: 'text',
		regex: 'abc?'
	})).toBe('文本/abc?/');
	expect(defs.show_basic_data_type({
		kind: 'number',
	})).toBe('數字');
});
test('基礎型別字串轉換', () => {
	expect(defs.show_data_type({
		kind: 'single',
		t: {
			kind: 'number',
		}
	})).toBe('數字');
	expect(defs.show_data_type({
		kind: 'optional',
		t: {
			kind: 'number',
		}
	})).toBe('數字 ‧ 可選');
	expect(defs.show_data_type({
		kind: 'array',
		t: {
			kind: 'number',
		},
		min: 1,
		max: 10
	})).toBe('數字 ‧ 陣列[1 ~ 10]');
});
