import * as React from 'react';
import { Redirect, Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import { UserState } from '../global_state/user';
import '../../css/party/my_party_list.css';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { Party } from '../../ts/api/api_trait';

import { EXILED_PARTY_NAME } from './index';
import { toastErr } from '../utils';

async function fetchPartyList(): Promise<Party[]> {
	let party_list = unwrap_or(await API_FETCHER.queryMyPartyList(), []);
	return party_list;
}

// TODO: 再發一個請求取得看板資訊
export function MyPartyList(props: RouteComponentProps<{}>): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [fetching, setFetching] = React.useState(true);
	let [party_list, setPartyList] = React.useState<Party[]>([]);

	React.useEffect(() => {
		fetchPartyList().then(tree => {
			setPartyList(tree);
			setFetching(false);
		}).catch(err => toastErr(err));
	}, []);

	if (!user_state.login && !user_state.fetching) {
		return <Redirect to="/app" />;
	} if (fetching) {
		return <div></div>;
	} else {
		return <div className="listBody">
			<CreatePartyBlock {...props} />
			{
				party_list.map(party => {
					return <div key={party.id} className="boardPartyBlock">
						{
							(() => {
								if (party.board_id == null) {
									return <div className="boardName">{EXILED_PARTY_NAME}</div>;
								} else {
									// XXX: 補看板名
									let href = `/app/board/${party.board_name}`;
									return <Link to={href} className="boardName">
										<div className="boardName">{party.board_name}</div>
									</Link>;
								}
							})()
						}
						<Link
							to={`/app/party/${party.party_name}`}
							key={party.id}
							className="partyColumn"
						>
							<div className="ruling">{party.ruling ? '執政 ' : ''}</div>
							<div className="partyLabel">{party.party_name}</div>
							<div className="partyLabel">☘ {party.energy}</div>
							{/* <div className="partyLabel">👑{party.chairmanId}</div> */}
							<div className="partyLabel">📊 10%</div>
						</Link>
					</div>;
				})
			}
		</div>;
	}
}

function CreatePartyBlock(props: RouteComponentProps<{}>): JSX.Element {
	let [expand, setExpand] = React.useState(false);
	let [party_name, setPartyName] = React.useState('');
	let [board_name, setBoardName] = React.useState('');
	return <>
		<div onClick={() => setExpand(!expand)} className="createParty"> 👥 創建政黨 </div>
		<div style={{ display: expand ? 'block' : 'none', textAlign: 'right' }}>
			<input type="text"
				value={party_name}
				placeholder="政黨名稱"
				className="createPartyInput"
				onChange={evt => {
					setPartyName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<input type="text"
				value={board_name}
				placeholder="依附於看板（預設為流亡政黨）"
				className="createPartyInput"
				onChange={evt => {
					setBoardName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<br />
			<button onClick={() => {
				API_FETCHER.createParty(
					party_name,
					board_name.length == 0 ? null : board_name,
				).then(res => {
					unwrap(res);
				}).then(() => {
					props.history.push(`/app/party/${party_name}`);
				}).catch(err => {
					toastErr(err);
				});
			}}>確認</button>
		</div>
	</>;
}