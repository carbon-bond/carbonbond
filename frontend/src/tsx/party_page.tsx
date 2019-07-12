import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { UserState } from './global_state';
import { getGraphQLClient } from './api';

type Props = RouteComponentProps<{}>;
type Party = { id: String, name: String, board_id: String };
type PartyTree = { [board_name: string]: Party };

async function fetchPartyTree(): Promise<PartyTree> {
	//let tree: PartyTree = {};
	let client = getGraphQLClient();
	const query = `
			{
				myPartyList
			}
		`;
	return client.request(query);
}

export function PartyPage(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [fetching, setFetching] = React.useState(true);
	let [party_tree, setPartyTree] = React.useState([]);

	React.useEffect(() => {
		if (!user_state.login && !user_state.fetching) {
			props.history.replace('app');
		}
	}, [user_state]);



	if (fetching) {
		return <div> 載入頁 </div>;
	} else {
		return <div> 政黨頁 </div>;
	}
}