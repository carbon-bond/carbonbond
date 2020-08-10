import { parse } from './parser';

test('解析簡單分類', () => {
	let force = parse('新聞 {單行 記者 單行 網址}');
	expect(force.categories.size).toBe(1);
	expect(force.categories.get('新聞')).toStrictEqual({
		name: '新聞',
		fields: [
			{ name: '記者', datatype: { kind: 'one_line' } },
			{ name: '網址', datatype: { kind: 'one_line' } },
		]
	});
});
