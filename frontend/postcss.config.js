module.exports = {
	plugins: {
		'postcss-preset-env': {
			features: {
				'nesting-rules': true
			}
		}, // 使用仍在 stage 的 CSS 特性
		'autoprefixer': {}, // 加入各家瀏覽器的前綴詞
	},
};
