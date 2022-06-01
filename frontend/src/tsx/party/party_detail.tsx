import * as React from 'react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Party, BoardType } from '../../ts/api/api_trait';
import { BoardEditor, BoardEditorKind } from '../board/board_editor';
import { EXILED_PARTY_NAME } from './index';
import { UserState } from '../global_state/user';
import { LocationState, PartyLocation } from '../global_state/location';

import style from '../../css/party/party_detail.module.css';
import { toastErr } from '../utils';

async function fetchPartyDetail(party_name: string): Promise<Party> {
	return unwrap(await API_FETCHER.partyQuery.queryParty(party_name));
}

export function PartyDetail(): JSX.Element {
	let [party, setParty] = React.useState<Party | null>(null);
	let [fetching, setFetching] = React.useState(true);
	const { setCurrentLocation } = LocationState.useContainer();
	let params = useParams();

	let party_name = params.party_name;
	React.useEffect(() => {
		if (!party_name) {
			console.error('無法從政黨頁網址取得政黨名稱');
			return;
		}
		fetchPartyDetail(party_name).then(p => {
			setParty(p);
			console.log(p);
			setFetching(false);
		}).catch(err => {
			toastErr(err);
		});
	}, [party_name]);

	React.useEffect(() => {
		if (party_name) {
			setCurrentLocation(new PartyLocation(party_name!));
		}
	}, [setCurrentLocation, party_name]);

	const { user_state } = UserState.useContainer();

	if (!party_name || fetching) {
		return <div></div>;
	} else if (party) {
		return <div className={style.partyDetail}>
			<div>
				<span className={style.partyName}>{party.party_name}</span>
				{(() => {
					if (party.board_name) {
						let href = `/app/b/general/${party.board_name}`;
						return <Link to={href} className={style.boardName}>
							<span>- b/{party.board_name}</span>
						</Link>;
					} else {
						return <span className={style.boardName}>{EXILED_PARTY_NAME}</span>;
					}
				})()}
			</div>
			{
				(() => {
					if (!party.board_id && user_state.login) {
						return <CreateBoardBlock party_id={party.id} />;
					} else {
						return null;
					}
				})()
			}
		</div>;
	} else {
		return <Navigate to="/app/party" />;
	}
}

function CreateBoardBlock(props: { party_id: number }): JSX.Element {
	let [expand, setExpand] = React.useState(false);

	return <div className={style.createBoardBlock}>
		<div onClick={() => setExpand(!expand)} className={style.createButton}>🏂 創立看板</div>
		{
			expand ? <BoardEditor
				board_type={BoardType.General}
				editor_data={{
					kind: BoardEditorKind.Create,
					party_id: props.party_id
				}}
				setVisible={setExpand} /> : <></>
		}
	</div>;
}