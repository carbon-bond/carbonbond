import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Link } from 'react-router-dom';
import { GQL, matchErrAndShow, ajaxOperation } from '../../ts/api';
import { EXILED_PARTY_NAME } from './index';
import { UserState } from '../global_state';

import '../../css/party.css';

type Party = GQL.PartyDetailQuery['party'];
type Props = RouteComponentProps<{ party_name?: string }>;

async function createBoard(party_name: string, board_name: string): Promise<void> {
	await ajaxOperation.CreateBoard({
		party_name, board_name
	});
	return;
}

async function fetchPartyDetail(name: string): Promise<Party> {
	let res = await ajaxOperation.PartyDetail({ name });
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
			}).catch(err => {
				matchErrAndShow(err, ['NOT_FOUND', '找不到政黨']);
			});
		} else {
			setFetching(false);
		}
	}, [party_name]);

	const { user_state } = UserState.useContainer();

	if (fetching) {
		return <div></div>;
	} else if (party) {
		return <div style={{ display: 'flex', flexDirection: 'column' }}>
			<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }}>
				<h1 style={{ marginRight: 20 }}>{party.partyName}</h1>
				{(() => {
					if (party.board) {
						let href = `/app/b/${party.board.boardName}`;
						return <Link to={href} styleName="boardName">
							<h3>- b/{party.board.boardName}</h3>
						</Link>;
					} else {
						return <h3 styleName="boardName">- {EXILED_PARTY_NAME}</h3>;
					}
				})()}
			</div>
			{
				(() => {
					if (!party.board && user_state.login && user_state.user_id == party.chairmanId) {
						return <CreateBoardBlock party_name={party.partyName} rp={props}/>;
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
	return <>
		<div onClick={() => setExpand(!expand)} style={{ cursor: 'pointer' }}>⚑創立看板</div>
		<div style={{ display: expand ? 'block' : 'none' }}>
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
	</>;
}