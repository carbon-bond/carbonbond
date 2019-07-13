import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { MyPartyList } from './my_party_list';
import { PartyDetail } from './party_detail';

export type Party = {
	id: string,
	partyName: string,
	energy: number,
	chairmanId: string,
	boardId: string | null,
	ruling?: true,
	power?: number,
	board?: { boardName: string }
};

export function PartyCenter(): JSX.Element {
	return <Switch>
		<Route exact path='/app/party' render={props =>
			<MyPartyList {...props}/>
		} />
		<Route path='/app/party/p/:party_name' render={props =>
			<PartyDetail {...props}/>
		} />
		<Redirect to='/app/party'/>
	</Switch>;
}