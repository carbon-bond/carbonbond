import * as React from 'react';
import { Redirect, Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import { UserState } from '../global_state';
import '../../css/party/my_party_list.css';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { Party } from '../../ts/api/api_trait';

import { EXILED_PARTY_NAME } from './index';
import { toast } from 'react-toastify';

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
		}).catch(err => toast.error(err));
	}, []);

	if (!user_state.login && !user_state.fetching) {
		return <Redirect to="/app" />;
	} if (fetching) {
		return <div></div>;
	} else {
		return <div styleName="listBody">
			<CreatePartyBlock {...props} />
			{
				party_list.map(party => {
					return <div key={party.id} styleName="boardPartyBlock">
						{
							(() => {
								if (party.board_id == null) {
									return <div styleName="boardName">{EXILED_PARTY_NAME}</div>;
								} else {
									// XXX: 補看板名
									let href = `/app/board/${party.board_name}`;
									return <Link to={href} styleName="boardName">
										<div styleName="boardName">{party.board_name}</div>
									</Link>;
								}
							})()
						}
						<Link
							to={`/app/party/${party.party_name}`}
							key={party.id}
							styleName="partyColumn"
						>
							<div styleName="ruling">{party.ruling ? '執政 ' : ''}</div>
							<div styleName="partyLabel">{party.party_name}</div>
							<div styleName="partyLabel">☘ {party.energy}</div>
							{/* <div styleName="partyLabel">👑{party.chairmanId}</div> */}
							<div styleName="partyLabel">📊 10%</div>
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
		<div onClick={() => setExpand(!expand)} styleName="createParty"> 👥 創建政黨 </div>
		<div style={{ display: expand ? 'block' : 'none', textAlign: 'right' }}>
			<input type="text"
				value={party_name}
				placeholder="政黨名稱"
				styleName="createPartyInput"
				onChange={evt => {
					setPartyName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<input type="text"
				value={board_name}
				placeholder="依附於看板（預設為流亡政黨）"
				styleName="createPartyInput"
				onChange={evt => {
					setBoardName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<br />
			<button onClick={() => {
				API_FETCHER.createParty(
					board_name.length == 0 ? null : board_name,
					party_name
				).then(res => {
					unwrap(res);
				}).then(() => {
					props.history.push(`/app/party/${party_name}`);
				}).catch(err => {
					toast.error(err);
				});
			}}>確認</button>
		</div>
	</>;
}