import * as React from "react";
import * as ReactDOM from "react-dom";

import "purecss/build/pure-min.css";

function App() {
	return (
		<div>
			<h1>金剛、石墨，參見！</h1>
			<button className="pure-button">註冊</button>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById("root"));
