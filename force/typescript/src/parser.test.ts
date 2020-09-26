import { parse, parse_category } from './parser';

test('解析簡單分類', () => {
	const source = '新聞 @[轉載, 外部] {單行 記者 單行 網址}';
	const force = parse(source);
	expect(force.categories.size).toBe(1);
	const ans = {
		name: '新聞',
		fields: [
			{ name: '記者', datatype: { kind: 'one_line' } },
			{ name: '網址', datatype: { kind: 'one_line' } },
		],
		family: [ '轉載', '外部' ]
	};
	expect(force.categories.get('新聞')).toStrictEqual(ans);
	expect(parse_category(source)).toStrictEqual(ans);
});

test('解析鍵結候選', () => {
	const source = '留言 { 鍵結[@批踢踢文章, @狄卡文章, 新聞] 原文 }';

	const force = parse(source);
	expect(force.categories.size).toBe(1);

	const ans = {
		name: '留言',
		fields: [
			{
				datatype: {
					kind: 'bond',
					bondee: {
						kind: 'choices',
						category: ['新聞'],
						family: ['批踢踢文章', '狄卡文章']
					}
				},
				name: '原文'
			},
		],
		family: []
	};
	expect(parse_category(source)).toStrictEqual(ans);
});