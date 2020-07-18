import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Redirect, Link } from 'react-router-dom';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Party } from '../../ts/api/api_trait';
import { EXILED_PARTY_NAME } from './index';
import { UserState } from '../global_state';
import { useForm } from 'react-hook-form';

import '../../css/party/party_detail.css';
import { toast } from 'react-toastify';
import { Parser } from 'force';

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

type Input = {
	board_name: string,
	title: string,
	detail: string,
	force: string,
};

function CreateBoardBlock(props: { party_id: number, rp: Props }): JSX.Element {
	const { register, handleSubmit, errors } = useForm<Input>({mode: 'onBlur'});
	let [expand, setExpand] = React.useState(false);
	function onSubmit(data: Input): void {
		API_FETCHER.createBoard({
			ruling_party_id: props.party_id,
			...data
		})
			.then(data => unwrap(data))
			.then(() => props.rp.history.push(`/app/b/${data.board_name}`))
			.catch(err => toast.error(err));
	}
	return <div styleName="createBoardBlock">
		<div onClick={() => setExpand(!expand)} styleName="createButton">🏂 創立看板</div>
		{
			expand ? <form onSubmit={handleSubmit(onSubmit)} styleName="form">
				<input name="board_name" placeholder="看板名稱" ref={register({required: true})} autoFocus/>
				{errors.board_name && <span>必填</span>}
				<input name="title" placeholder="版主的話" ref={register} />
				<textarea name="detail" placeholder="看板介紹" ref={register} />
				<textarea name="force" placeholder="力語言（定義看板分類、鍵結規則）" ref={register({
					validate: (value) => {
						try {
							const parser = new Parser(value);
							parser.parse();
							return true;
						} catch (err) {
							console.log(err);
							return false;
						}
					}
				})} />
				{errors.force && <span>力語言語法錯誤</span>}
				<input type="submit" value="確認"/>
			</form>
				: <></>
		}
	</div>;
}