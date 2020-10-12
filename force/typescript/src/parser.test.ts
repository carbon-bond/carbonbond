import { Category } from './defs';
import { parse, parse_category } from './parser';

test('解析簡單分類', () => {
	const source = '新聞 @[轉載, 外部] {單行 記者 單行 網址}';
	const force = parse(source);
	expect(force.categories.size).toBe(1);
	const ans = {
		name: '新聞',
		fields: [
			{ name: '記者',  datatype: { kind: 'single', t: { kind: 'one_line' } } },
			{ name: '網址',  datatype: { kind: 'single', t: { kind: 'one_line' } } },
		],
		family: [ '轉載', '外部' ]
	};
	expect(force.categories.get('新聞')).toStrictEqual(ans);

	expect(parse_category(source)).toStrictEqual(ans);

	expect(force.families.size).toBe(2);
	expect(force.families.get('轉載')!.length).toBe(1);
	expect(force.families.get('轉載')!.includes('新聞')).toBe(true);
	expect(force.families.get('外部')!.length).toBe(1);
	expect(force.families.get('外部')!.includes('新聞')).toBe(true);
});

test('解析鍵結候選', () => {
	const source = '留言 { 鍵結[@批踢踢文章, @狄卡文章, 新聞] 原文 }';

	const ans: Category = {
		name: '留言',
		fields: [
			{
				datatype: {
					kind: 'single',
					t: {
						kind: 'bond',
						bondee: {
							kind: 'choices',
							category: ['新聞'],
							family: ['批踢踢文章', '狄卡文章']
						}
					},
				},
				name: '原文'
			}
		],
		family: []
	};

	expect(parse_category(source)).toStrictEqual(ans);

});

test('解析分類族', () => {
	const source = `
	留言 { 鍵結[@批踢踢文章, @狄卡文章, 新聞] 原文 }
	新聞 {}
	八卦 @[批踢踢文章] {}
	政黑 @[批踢踢文章] {}
	有趣 @[狄卡文章] {}
`;

	const force = parse(source);

	expect(force.families.get('批踢踢文章')!.length).toBe(2);
	expect(force.families.get('批踢踢文章')!.includes('八卦')).toBe(true);
	expect(force.families.get('批踢踢文章')!.includes('政黑')).toBe(true);

	expect(force.families.get('狄卡文章')!.length).toBe(1);
	expect(force.families.get('狄卡文章')!.includes('有趣')).toBe(true);

});