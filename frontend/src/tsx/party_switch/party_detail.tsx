import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Link } from 'react-router-dom';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Party, BoardType } from '../../ts/api/api_trait';
import { BoardCreator } from '../board_switch/board_creator';
import { EXILED_PARTY_NAME } from './index';
import { UserState } from '../global_state/user';

import '../../css/party/party_detail.css';
import { toastErr } from '../utils';

type Props = RouteComponentProps<{ party_name?: string }>;

async function fetchPartyDetail(party_name: string): Promise<Party> {
	return unwrap(await API_FETCHER.queryParty(party_name));
}

export function PartyDetail(props: Props): JSX.Element {
	let [party, setParty] = React.useState<Party | null>(null);
	let [fetching, setFetching] = React.useState(true);

	let party_name = props.match.params.party_name!;
	React.useEffect(() => {
		fetchPartyDetail(party_name).then(p => {
			setParty(p);
			console.log(p);
			setFetching(false);
		}).catch(err => {
			toastErr(err);
		});
	}, [party_name]);

	const { user_state } = UserState.useContainer();

	if (fetching) {
		return <div></div>;
	} else if (party) {
		return <div className="partyDetail">
			<div>
				<span className="partyName">{party.party_name}</span>
				{(() => {
					if (party.board_name) {
						let href = `/app/b/${party.board_name}`;
						return <Link to={href} className="boardName">
							<span>- b/{party.board_name}</span>
						</Link>;
					} else {
						return <span className="boardName">{EXILED_PARTY_NAME}</span>;
					}
				})()}
			</div>
			{
				(() => {
					if (!party.board_id && user_state.login) {
						return <CreateBoardBlock party_id={party.id} rp={props} />;
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

function CreateBoardBlock(props: { party_id: number, rp: Props }): JSX.Element {
	let [expand, setExpand] = React.useState(false);

	return <div className="createBoardBlock">
		<div onClick={() => setExpand(!expand)} className="createButton">🏂 創立看板</div>
		<BoardCreator board_type={BoardType.General} party_id={props.party_id} visible={expand} setVisible={setExpand} history={props.rp.history} />
	</div>;
}