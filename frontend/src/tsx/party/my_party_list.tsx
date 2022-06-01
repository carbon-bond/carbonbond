import * as React from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';

import { UserState } from '../global_state/user';
import { LocationState, SimpleLocation } from '../global_state/location';
import style from '../../css/party/my_party_list.module.css';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { Party } from '../../ts/api/api_trait';

import { EXILED_PARTY_NAME } from './index';
import { toastErr } from '../utils';

async function fetchPartyList(): Promise<Party[]> {
	let party_list = unwrap_or(await API_FETCHER.userQuery.queryMyPartyList(), []);
	return party_list;
}

// TODO: 再發一個請求取得看板資訊
export function MyPartyList(): JSX.Element {
	let [fetching, setFetching] = React.useState(true);
	let [party_list, setPartyList] = React.useState<Party[]>([]);
	let { user_state } = UserState.useContainer();
	const { setCurrentLocation } = LocationState.useContainer();

	React.useEffect(() => {
		fetchPartyList().then(tree => {
			setPartyList(tree);
			setFetching(false);
		}).catch(err => toastErr(err));
	}, []);

	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('我的政黨'));
	}, [setCurrentLocation]);

	if (!user_state.login) {
		return <Navigate to="/app" />;
	} if (fetching) {
		return <div></div>;
	} else {
		return <div className={style.listBody}>
			{
				party_list.map(party => {
					return <div key={party.id} className={style.boardPartyBlock}>
						{
							(() => {
								if (party.board_id == null) {
									return <div className={style.boardName}>{EXILED_PARTY_NAME}</div>;
								} else {
									let href = `/app/b/general/${party.board_name}`;
									return <Link to={href} className={style.boardName}>
										<div className={style.boardName}>{party.board_name}</div>
									</Link>;
								}
							})()
						}
						<Link
							to={`/app/party/${party.party_name}`}
							key={party.id}
							className={style.partyColumn}
						>
							<div className={style.ruling}>{party.ruling ? '👑 執政 ' : '🌿 在野'}</div>
							<div className={style.partyLabel}>{party.party_name}</div>
							<div className={style.partyLabel}>☘ {party.energy}</div>
							{/* <div className={style.partyLabel}>{party.chairmanId}</div> */}
							{/* <div className={style.partyLabel}>📊 10%</div> */}
						</Link>
					</div>;
				})
			}
			<div className={style.partyIntroduction}>
				<p>
					碳鍵中的每個看板都是一個政體（國家），
					由一個執政黨管理。
				</p>
				<p>
					任何用戶均可建立自己的政黨。政黨可以依附在任何看板之下（或是不依附任何看板，此時會被稱爲流亡政黨）。
					透過發表文章、留言等，累積鍵能。當鍵能達到一定數量後，便可以創建自己的看板或奪取他人的看板。
				</p>
				<p>
					碳鍵希望讓用戶自行爭取其他用戶的認同或回響，並透過政黨系統自治。
				</p>
				<div className={style.declaration}>
					以上敘述的政黨系統尚只有雛形，有以下限制
					<ul>
						<li>目前的黨員人數僅能有一人（每個黨都是一人政黨）</li>
						<li>政黨還無法累積鍵能，沒有任何門檻就能創版</li>
						<li>無奪權功能</li>
					</ul>
					請謹慎使用政黨及創版功能，若您僅是想體驗創版，建議你試試開個<Link to={`/app/b/personal/${user_state.user_name}`}>個版</Link>
				</div>
			</div>
			<CreatePartyBlock />
		</div>;
	}
}

function CreatePartyBlock(): JSX.Element {
	let [expand, setExpand] = React.useState(false);
	let [party_name, setPartyName] = React.useState('');
	let [board_name, setBoardName] = React.useState('');
	let navigate = useNavigate();
	return <>
		<div onClick={() => setExpand(!expand)} className={style.createParty}> 👥 創建政黨 </div>
		<div style={{ display: expand ? 'block' : 'none', textAlign: 'right' }}>
			<input type="text"
				value={party_name}
				placeholder="政黨名稱"
				className={style.createPartyInput}
				onChange={evt => {
					setPartyName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<input type="text"
				value={board_name}
				placeholder="依附於看板（不依附則為流亡政黨）"
				className={style.createPartyInput}
				onChange={evt => {
					setBoardName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<br />
			<button onClick={() => {
				API_FETCHER.partyQuery.createParty(
					party_name,
					board_name.length == 0 ? null : board_name,
				).then(res => {
					unwrap(res);
				}).then(() => {
					navigate(`/app/party/${party_name}`);
				}).catch(err => {
					toastErr(err);
				});
			}}>確認</button>
		</div>
	</>;
}