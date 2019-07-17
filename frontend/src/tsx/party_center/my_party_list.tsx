import * as React from 'react';
import { toast } from 'react-toastify';
import { Redirect, Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import { UserState } from '../global_state';
import { getGraphQLClient, extractErrMsg } from '../api';
import '../../css/party.css';

import { Party, EXILED_PARTY_NAME } from './index';

type Board = { id: string, boardName: string, rulingPartyId: string };
type PartyTree = { [board_name: string]: Party[] };

async function fetchPartyTree(): Promise<PartyTree> {
	let tree: PartyTree = {};
	let b_name_id_table: { [id: string]: Board | null } = {};
	let client = getGraphQLClient();
	const query1 = `
			{
				myPartyList {
					id, partyName, boardId, energy, chairmanId
				}
			}
		`;
	let res: { myPartyList: Party[] } = await client.request(query1);
	let party_list = res.myPartyList;
	for (let party of party_list) {
		if (party.boardId) {
			b_name_id_table[party.boardId] = null;
		} else {
			tree[EXILED_PARTY_NAME] = [];
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
			tree[EXILED_PARTY_NAME].push(party);
		}
	}
	return tree;
}

export function MyPartyList(props: RouteComponentProps<{}>): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [fetching, setFetching] = React.useState(true);
	let [party_tree, setPartyTree] = React.useState<PartyTree>({});

	React.useEffect(() => {
		fetchPartyTree().then(tree => {
			setPartyTree(tree);
			setFetching(false);
		});
	}, []);

	if (!user_state.login && !user_state.fetching) {
		return <Redirect to="/app" />;
	} if (fetching) {
		return <div></div>;
	} else {
		return <div styleName='listBody'>
			<CreatePartyBlock {...props} />
			{
				Object.keys(party_tree).map(b_name => {
					return <div key={b_name} styleName='boardPartyBlock'>
						{
							(() => {
								if (b_name == EXILED_PARTY_NAME) {
									return <div styleName='boardName'>{b_name}</div>;
								} else {
									let href = `/app/${b_name}`;
									return <Link to={href} styleName='boardName'>
										<div styleName='boardName'>{b_name}</div>
									</Link>;
								}
							})()
						}
						{
							party_tree[b_name].map(party => {
								return (
									<Link
										to={`/app/party/${party.partyName}`}
										key={party.id}
										styleName='partyColumn'
									>
										<div styleName="ruling">{party.ruling ? '☆ ' : ''}</div>
										<div styleName='partyLabel'>{party.partyName}</div>
										<div styleName='partyLabel'>⚡{party.energy}</div>
										<div styleName='partyLabel'>👑{party.chairmanId}</div>
										<div styleName='partyLabel'>📊 10%</div>
									</Link>
								);
							})
						}
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
		<div onClick={() => setExpand(!expand)} styleName='createParty'> 👥 創建政黨 </div>
		<div style={{ display: expand ? 'block' : 'none', textAlign: 'right' }}>
			<input type='text'
				value={party_name}
				placeholder='政黨名稱'
				styleName='createPartyInput'
				onChange={evt => {
					setPartyName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<input type='text'
				value={board_name}
				placeholder='依附於看板（預設為流亡政黨）'
				styleName='createPartyInput'
				onChange={evt => {
					setBoardName(evt.target.value);
					// TODO: 向後端詢問
				}}
			/>
			<br />
			<button onClick={() => {
				let client = getGraphQLClient();
				let b_name_query = board_name.length == 0 ? '' : ` boardName: "${board_name}"`;
				const query = `
					mutation {
						createParty(partyName: "${party_name}" ${b_name_query})
					}
				`;
				client.request(query).then(() => {
					props.history.push(`/app/party/${party_name}`);
				}).catch(err => {
					toast.error(extractErrMsg(err));
				});
			}}>確認</button>
		</div>
	</>;
}