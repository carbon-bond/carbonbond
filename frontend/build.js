const webpack = require('webpack');
const config = require('./webpack.config.js');
const { execSync } = require('child_process');
const watch = require('node-watch');
require('colors');

const argv = require('minimist')(process.argv.slice(2));

const handler = (err, stats) => {
	if (err) {
		console.error(err);
		return;
	}

	console.log(stats.toString({
		chunks: false,
		colors: true,
		cached: false,
	}));
};

const compiler = webpack(config);

function api_codegen() {
	try {
		execSync('yarn api-codegen', { stdio: 'inherit' });
		console.log('graphql 編譯完成'.green);
	} catch (err) {
		console.log('graphql 編譯錯誤'.red);
	}
}

if (argv['watch']) {
	// api codegen
	api_codegen();
	watch(`${__dirname}/../api/api.gql`, api_codegen);
	watch(`${__dirname}/operation`, api_codegen);

	// webpack
	compiler.watch({
		aggregateTimeout: 300,
		poll: undefined
	}, handler);
} else {
	// api codegen
	api_codegen();

	// webpack
	compiler.run(handler);
}
