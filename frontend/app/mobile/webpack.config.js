const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
	const config = await createExpoWebpackConfigAsync(env, argv);

	// 客製化
	config.devServer = {
		proxy: {
			'/api': 'http://127.0.0.1:8080',
			'/avatar': 'http://127.0.0.1:8080',
			'/chat': {
				target: 'ws://127.0.0.1:8080',
				ws: true,
			},
		}
	};

	return config;
};
