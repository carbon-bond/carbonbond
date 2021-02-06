import { lexer } from './lexer';

test('lexer 解析整數', () => {
	lexer.reset('12345 123木頭人 木頭人321 123木頭人321');
	expect(lexer.next()!.type!).toBe('integer');
	expect(lexer.next()!.type!).toBe('identifier');
	expect(lexer.next()!.type!).toBe('identifier');
	expect(lexer.next()!.type!).toBe('identifier');
	expect(lexer.next()).toBe(undefined);
});

test('lexer 解析特殊符號', () => {
	lexer.reset('{}[],#:@?~');
	expect(lexer.next()!.type!).toBe('left_curly_brace');
	expect(lexer.next()!.type!).toBe('right_curly_brace');
	expect(lexer.next()!.type!).toBe('left_square_bracket');
	expect(lexer.next()!.type!).toBe('right_square_bracket');
	expect(lexer.next()!.type!).toBe('comma');
	expect(lexer.next()!.type!).toBe('sharp');
	expect(lexer.next()!.type!).toBe('colon');
	expect(lexer.next()!.type!).toBe('at');
	expect(lexer.next()!.type!).toBe('question_mark');
	expect(lexer.next()!.type!).toBe('tilde');
	expect(lexer.next()).toBe(undefined);
});

test('lexer 解析關鍵字', () => {
	lexer.reset('單行 文本 數字 鍵結 輸能');
	expect(lexer.next()!.type!).toBe('one_line');
	expect(lexer.next()!.type!).toBe('text');
	expect(lexer.next()!.type!).toBe('number');
	expect(lexer.next()!.type!).toBe('bond');
	expect(lexer.next()!.type!).toBe('transfuse');
	expect(lexer.next()).toBe(undefined);
});

test('lexer 解析識別子', () => {
	lexer.reset('單行文本數字鍵結輸能');
	expect(lexer.next()!.type!).toBe('identifier');
	lexer.reset('Gossip');
	expect(lexer.next()!.type!).toBe('identifier');
	lexer.reset('八卦');
	expect(lexer.next()!.type!).toBe('identifier');
	lexer.reset('play_boy');
	expect(lexer.next()!.type!).toBe('identifier');
	lexer.reset('花花公子');
	expect(lexer.next()!.type!).toBe('identifier');
});

test('lexer 解析正則表達式', () => {
	lexer.reset('/[ab]+d?/');
	expect(lexer.next()!.type!).toBe('regex');
});

test('lexer 解析分類族', () => {
	lexer.reset('@批踢踢文章');
	expect(lexer.next()!.type!).toBe('at');
	expect(lexer.next()!.type!).toBe('identifier');
	expect(lexer.next()).toBe(undefined);
});