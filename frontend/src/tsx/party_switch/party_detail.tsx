import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Link } from 'react-router-dom';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Party } from '../../ts/api/api_trait';
import { EXILED_PARTY_NAME } from './index';
import { UserState } from '../global_state';

import '../../css/party/party_detail.css';
import { toast } from 'react-toastify';

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
			setFetching(false);
		}).catch(err => {
			toast.error(err);
		});
	}, [party_name]);

	const { user_state } = UserState.useContainer();

	if (fetching) {
		return <div></div>;
	} else if (party) {
		return <div styleName="partyDetail">
			<div>
				<span styleName="partyName">{party.party_name}</span>
				{(() => {
					if (party.board_name) {
						// TODO: 取得 board_name
						let href = `/app/b/${party.board_name}`;
						return <Link to={href} styleName="boardName">
							<span>- b/{party.board_name}</span>
						</Link>;
					} else {
						return <span styleName="boardName">{EXILED_PARTY_NAME}</span>;
					}
				})()}
			</div>
			{
				(() => {
					if (!party.board_id && user_state.login) {
						return <CreateBoardBlock party_id={party.id} rp={props}/>;
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
	let [board_name, setBoardName] = React.useState('');
	return <div styleName="createBoardBlock">
		<div onClick={() => setExpand(!expand)} style={{ cursor: 'pointer' }}>🏂 創立看板</div>
		{
			expand ? <div>
				<input type="text"
					placeholder="看板名稱"
					value={board_name}
					onChange={evt => {
						setBoardName(evt.target.value);
					}}
				/>
				<button onClick={() => {
					API_FETCHER.createBoard({
						board_name,
						ruling_party_id: props.party_id,
						title: '',
						detail: ''
					})
						.then(data => unwrap(data))
						.then(() => props.rp.history.push(`/app/b/${board_name}`))
						.catch(err => toast.error(err));
				}}>確認</button>
			</div>
				: <></>
		}
	</div>;
}