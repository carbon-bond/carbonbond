import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { MyPartyList } from './my_party_list';

export function PartyCenter(): JSX.Element {
	return <Switch>
		<Route exact path='/app/party' render={() =>
			<MyPartyList />
		} />
		<Route exact path='/app/party/new' render={() =>
			<div>新政黨</div>
		} />
		<Redirect to='/app/party'/>
	</Switch>;
}