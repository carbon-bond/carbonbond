const path = require("path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	entry: {
		index: "./src/tsx/app.tsx"
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
	},
	output: {
		path: path.resolve(__dirname, "static/dist"),
		filename: "bundle.js",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								"@babel/typescript",
							],
						}
					},
				]
			},
			{
				test: /\.tsx$/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								"@babel/typescript",
								"@babel/preset-react"
							],
							plugins: [
								[
									"react-css-modules",
									{ generateScopedName: "[local]-[hash:base64:10]" }
								]
							]
						}
					},
				]
			},
			{
				test: /\.css$/,
				oneOf: [
					{
						// import 時，後綴 ?global 代表 css 作用到全域
						resourceQuery: /^\?global$/,
						use: ["style-loader", "css-loader"]
					},
					{
						use: ["style-loader", "css-loader?modules&localIdentName=[local]-[hash:base64:10]", "postcss-loader"]
					}
				]
			},
		]
	},
	plugins: [
		/*new HtmlWebpackPlugin({
			template: "./src/index.html"
		})*/
	],
	mode: "development"
};
