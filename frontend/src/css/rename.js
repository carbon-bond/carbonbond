const fs = require('fs');

const not_modules = [
	'global.css', 'layout.css', 'variable.css'
];

const walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else { 
            /* Is a file */
            results.push(file);
        }
    });
    return results;
}

let files = walk('.');
for (const file of files) {
	const sp = file.split('.');
	const sp2 = file.split('/');
	const len = sp.length;
	if (sp[len - 1] == 'css' && sp[len - 2] != 'module' && !not_modules.includes(sp2[sp2.length - 1])) {
		const new_file = file.slice(0, file.length - 3) + 'module.css';
		fs.renameSync(file, new_file);
	} else {
		console.log(file);
	}
}