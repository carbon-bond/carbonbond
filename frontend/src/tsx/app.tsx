import * as React from "react";
import * as ReactDOM from "react-dom";

import "purecss/build/pure-min.css?global";
// import "purecss/build/pure-min.css";
import "../css/normal.css";

import { Component } from "./component";

function App() {
	return (
		<div>
			<h1>金剛、石墨，參見！</h1>
			<h2>outer h2</h2>
			<div styleName="green">
				<h2>h2</h2>
				<h3>h3</h3>
			</div>
			<button className="pure-button">global</button>
			{/* <button styleName="pure-button">local</button> */}
			<div className="red">red global</div>
			<div styleName="red">red local</div>
			<Component></Component>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById("root"));
