import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { UserState } from './global_state';
import { getGraphQLClient } from './api';
import '../css/party.css';

type Props = RouteComponentProps<{}>;
type Party = { id: string, partyName: string, boardId?: string, ruling?: true };
type Board = { id: string, boardName: string, rulingPartyId: string };
type PartyTree = { [board_name: string]: Party[] };

async function fetchPartyTree(): Promise<PartyTree> {
	let tree: PartyTree = {};
	let b_name_id_table: { [id: string]: Board | null } = {};
	let client = getGraphQLClient();
	const query1 = `
			{
				myPartyList {
					id, partyName, boardId
				}
			}
		`;
	let res: { myPartyList: Party[] } = await client.request(query1);
	let party_list = res.myPartyList;
	for (let party of party_list) {
		if (party.boardId) {
			b_name_id_table[party.boardId] = null;
		} else {
			tree['流浪政黨'] = [];
		}
	}
	let query2 = `
		{
			boardList(ids: [${Object.keys(b_name_id_table)}]) {
				boardName, id, rulingPartyId
			}
		}
	`;
	let res2: { boardList: Board[] } = await client.request(query2);
	let board_list = res2.boardList;
	for (let board of board_list) {
		b_name_id_table[board.id] = board;
		tree[`b/${board.boardName}`] = [];
	}
	for (let party of party_list) {
		if (party.boardId) {
			let board = b_name_id_table[party.boardId];
			if (board) {
				if (party.id == board.rulingPartyId) {
					party.ruling = true;
				}
				tree[`b/${board.boardName}`].push(party);
			}
		} else {
			tree['流浪政黨'].push(party);
		}
	}
	console.log(tree);
	return tree;
}

export function PartyPage(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [fetching, setFetching] = React.useState(true);
	let [party_tree, setPartyTree] = React.useState<PartyTree>({});

	React.useEffect(() => {
		if (!user_state.login && !user_state.fetching) {
			props.history.replace('app');
		}
	}, [user_state]);

	React.useEffect(() => {
		fetchPartyTree().then(tree => {
			setPartyTree(tree);
			setFetching(false);
		});
	}, []);

	if (fetching) {
		return <div> 載入頁 </div>;
	} else {
		return <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
			<div style={{ display: 'flex', flex: 1 }}/>
			<div style={{ display: 'flex', flexDirection: 'column',width: 300 }}>
				<div>👥 創建政黨</div>
				{
					Object.keys(party_tree).map(b_name => {
						return <div key={b_name}>
							<div styleName='boardName'>{b_name}</div>
							{
								party_tree[b_name].map(party => {
									return <div key={party.id} style={{ display: 'flex', flexDirection: 'row' }}>
										<div styleName='partyLebel'>{party.ruling ? '☆' : ''}{party.partyName}</div>
										<div styleName='partyLebel'>鍵能</div>
									</div>;
								})
							}
						</div>;
					})
				}
			</div>
			<div style={{ display: 'flex', flex: 1 }}/>
		</div>;
	}
}