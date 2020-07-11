import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Link } from 'react-router-dom';
import { matchErrAndShow, ajaxOperation } from '../../ts/api';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Party } from '../../ts/api/api_trait';
import { EXILED_PARTY_NAME } from './index';
import { UserState } from '../global_state';

import '../../css/party/party_detail.css';

type Props = RouteComponentProps<{ party_name?: string }>;

async function createBoard(party_name: string, board_name: string): Promise<void> {
	await ajaxOperation.CreateBoard({
		party_name, board_name
	});
	return;
}

async function fetchPartyDetail(id: number): Promise<Party> {
	return unwrap(await API_FETCHER.queryParty(id));
}

export function PartyDetail(props: Props): JSX.Element {
	let [party, setParty] = React.useState<Party | null>(null);
	let [fetching, setFetching] = React.useState(true);

	// TODO: 改回用 party_name ?
	let party_id = props.match.params.party_name;
	React.useEffect(() => {
		if (typeof party_id == 'string') {
			fetchPartyDetail(parseInt(party_id)).then(p => {
				setParty(p);
				setFetching(false);
			}).catch(err => {
				matchErrAndShow(err);
			});
		} else {
			setFetching(false);
		}
	}, [party_id]);

	const { user_state } = UserState.useContainer();

	if (fetching) {
		return <div></div>;
	} else if (party) {
		return <div styleName="partyDetail">
			<div>
				<span styleName="partyName">{party.party_name}</span>
				{(() => {
					if (party.board_id) {
						// TODO: 取得 board_name
						let href = `/app/b/${party.board_id}`;
						return <Link to={href} styleName="boardName">
							<span>- b/{party.board_id}</span>
						</Link>;
					} else {
						return <span styleName="boardName">{EXILED_PARTY_NAME}</span>;
					}
				})()}
			</div>
			{
				(() => {
					if (!party.board_id && user_state.login) {
						return <CreateBoardBlock party_name={party.id.toString()} rp={props}/>;
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

function CreateBoardBlock(props: { party_name: string, rp: Props }): JSX.Element {
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
					createBoard(props.party_name, board_name).then(() => {
						// FIXME: 跳轉到新創立的看板
						props.rp.history.push(`/app/b/${board_name}`);
					}).catch(err => {
						matchErrAndShow(err);
					});
				}}>確認</button>
			</div>
				: <></>
		}
	</div>;
}