const webpack = require('webpack');
const config = require('./webpack.config.js');

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

if (argv['watch']) {
	// webpack
	compiler.watch({
		aggregateTimeout: 300,
		poll: undefined
	}, handler);
} else {
	// webpack
	compiler.run(handler);
}
