const fs = require('fs');
const { argv } = require('process');

const files = argv.slice(2);


function change(file) {
	let str = fs.readFileSync(file).toString();
	console.log(str.split('className'));
	const pieces = str.split('className');
	const new_pieces = [];
	for (const piece of pieces) {
		if (/^="/.test(piece)) {
			const ss = piece.split('"');
			new_pieces.push(ss[0] + `{style.${ss[1]}}` + ss.slice(2).join('"'));
		} else {
			new_pieces.push(piece);
		}
	}
	console.log(new_pieces.join('className'));
	fs.writeFileSync(file, new_pieces.join('className'));
}


for (const file of files) {
	change(file);
}