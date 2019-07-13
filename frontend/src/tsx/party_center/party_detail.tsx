import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect } from 'react-router-dom';
import { getGraphQLClient } from '../api';
import { Party } from './index';
import { UserState } from '../global_state';

type Props = RouteComponentProps<{ party_name?: string }>;

async function fetchPartyDetail(name: string): Promise<Party> {
	let client = getGraphQLClient();
	const query = `
			{
				party(partyName: "${name}") {
					id, partyName, boardId,
					energy, chairmanId, power,
					board { boardName }
				}
			}
		`;
	let res: { party: Party } = await client.request(query);
	return res.party;
}

export function PartyDetail(props: Props): JSX.Element {
	let [party, setParty] = React.useState<Party | null>(null);
	let [fetching, setFetching] = React.useState(true);

	let party_name = props.match.params.party_name;
	React.useEffect(() => {
		if (typeof party_name == 'string') {
			fetchPartyDetail(party_name).then(p => {
				setParty(p);
				setFetching(false);
			}).catch(e => {
				// TODO: 錯誤處理
				console.log(e);
				setFetching(false);
			});
		} else {
			setFetching(false);
		}
	}, [party_name]);

	const { user_state } = UserState.useContainer();

	if (fetching) {
		return <div></div>;
	} else if (party) {
		let b_name = (() => {
			if (party.board) {
				return `\b${party.board.boardName}`;
			} else {
				return '流浪政黨';
			}
		})();
		return <div style={{ display: 'flex', flexDirection: 'column' }}>
			<h1 style={{ display: 'inline-flex' }}>{party.partyName}</h1>
			<h5 style={{ display: 'inline-flex' }}>{b_name}</h5>
			{
				(() => {
					if (!party.board && user_state.login && user_state.user_id == party.chairmanId) {
						return <CreateBoardBlock/>;
					} else {
						return null;
					}
				})()
			}
		</div>;
	} else {
		return <Redirect to="/app/party" />;
	}
}

function CreateBoardBlock(): JSX.Element {
	let [expand, setExpand] = React.useState(false);
	return <>
		<div onClick={() => setExpand(!expand)} style={{ cursor: 'pointer' }}>⚑創立看板</div>
		<div style={{ display: expand ? 'block' : 'none' }}>
			<input type='text' placeholder='看板名稱'/>
			<button>確認</button>
		</div>
	</>;
}