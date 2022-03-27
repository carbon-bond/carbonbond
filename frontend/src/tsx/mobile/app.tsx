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
import { Footer, FooterOption, FooterState } from './footer';
import { NotificationModal } from './notification';
import { MainRoutes } from '../app/main_routes';
import { init, useInit } from '../app/init';
import { Providers } from '../app/providers';

function MainBody(): JSX.Element {
	let { footer_option } = FooterState.useContainer();
	let show_main_scroll = footer_option == FooterOption.Home;

	return <div className="mainBody"
		style={{ overflowY: show_main_scroll ? 'auto' : 'hidden' }} >
		{
			footer_option == FooterOption.Notification ?
				<NotificationModal/> : null
		}
		<MainRoutes />
	</div>;
}

function Content(): JSX.Element {
	useInit();
	return <Router>
		<Header />
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
				<FooterState.Provider>
					<Content />
				</FooterState.Provider>
			</Providers>
		</div>
	);
}

init({
	is_mobile: true
});


ReactDOM.render(<App />, document.getElementById('root'));