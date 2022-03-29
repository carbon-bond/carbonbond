import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
} from 'react-router-dom';

import 'react-toastify/dist/ReactToastify.css';
import 'normalize.css';
import '../css/variable.css';
import '../css/layout.css';
import '../css/global.css';

import { Header } from './header';
import { LeftPanel } from './left_panel';
import { BottomPanel } from './bottom_panel';
import { MainRoutes } from './app/main_routes';
import { init, useInit } from './app/init';

import { Providers } from './app/providers';

function MainBody(): JSX.Element {
	return <div className="mainBody">
		<MainRoutes />
	</div>;
}
function Content(): JSX.Element {
	useInit();
	return <Router>
		<Header />
		<div className="other">
			<LeftPanel></LeftPanel>
			<MainBody />
			<BottomPanel></BottomPanel>
		</div>
	</Router>;
}
function App(): JSX.Element {
	return (
		<div className="app">
			<Providers>
				<Content />
			</Providers>
		</div>
	);
}

init({
	is_mobile: false
});

ReactDOM.render(<App />, document.getElementById('root'));
