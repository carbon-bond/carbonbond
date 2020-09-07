import { parse, parse_category } from './parser';

test('解析簡單分類', () => {
	const source = '新聞 {單行 記者 單行 網址}';
	const force = parse(source);
	expect(force.categories.size).toBe(1);
	const ans = {
		name: '新聞',
		fields: [
			{ name: '記者', datatype: { kind: 'one_line' } },
			{ name: '網址', datatype: { kind: 'one_line' } },
		]
	};
	expect(force.categories.get('新聞')).toStrictEqual(ans);
	expect(parse_category(source)).toStrictEqual(ans);
});
