import * as moo from 'moo';

let lexer = moo.compile({
	whitespace: /[ \t]+/,
	new_line: { match: /\n/, lineBreaks: true },

	// 特殊符號
	left_curly_brace: '{',
	right_curly_brace: '}',
	left_square_bracket: '[',
	right_square_bracket: ']',
	comma: ',',
	sharp: '#',
	colon: ':',
	at: '@',
	question_mark: '?',
	tilde: '~',

	star: '*',

	regex: new RegExp('/[^/]+/'),

	identifier: {
		match: /[^\s/\[\],\{\}\?~#@:]+/,
		type: moo.keywords({
			one_line: '單行',
			text: '文本',
			number: '數字',
			bond: '鍵結',

			transfuse: '輸能',
		})
	},
});

lexer.next = (next => () => {
	let token;
	while ((token = next.call(lexer)) && (token.type == 'whitespace' || token.type == 'new_line')) { }
	if (token?.type == 'regex') { // 把正則表達式兩旁的 / / 拔掉
		token.value = token.value.slice(1, -1);
	}
	if (token?.type == 'identifier' && /^[0-9]+$/.test(token.value)) {
		token.type = 'integer';
	}
	return token;
})(lexer.next);

export {
	lexer
};