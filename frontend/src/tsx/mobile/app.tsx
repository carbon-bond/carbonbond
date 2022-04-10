import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
} from 'react-router-dom';

import 'react-toastify/dist/ReactToastify.css';
import 'normalize.css';
import '../../css/variable.css';
import '../../css/layout.css';
import '../../css/global.css';

import { Header } from './header';
import { Footer } from './footer';
import { MainRoutes } from '../app/main_routes';
import { init, useInit } from '../app/init';
import { Providers } from '../app/providers';
import { Panel } from './panel';

function MainBody(): JSX.Element {
	return <div className="mainBody" >
		<MainRoutes />
	</div>;
}

function Content(): JSX.Element {
	useInit();
	return <Router>
		<Header />
		<Panel />
		<div className="other" >
			<MainBody />
		</div>
		<Footer />
	</Router>;
}

function App(): JSX.Element {
	return (
		<div className="appMobile">
			<Providers>
				<Content />
			</Providers>
		</div>
	);
}

init({
	is_mobile: true
});


ReactDOM.render(<App />, document.getElementById('root'));