import * as React from 'react';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';
import { Author, Board, Party, User } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';

import style from '../../css/board/right_sidebar.module.css';
import { toastErr, useSubscribeBoard } from '../utils';
import { Link } from 'react-router-dom';
import { ProfileDetail } from '../profile/user_page';
import { ShowText } from '../display/show_text';

export function BoardSidebar(props: { board: Board }): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [ parties, setParties ] = React.useState(new Array<Party>());
	const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	let { has_subscribed, toggleSubscribe } = useSubscribeBoard(props.board);

	React.useEffect(() => {
		API_FETCHER.partyQuery.queryBoardPartyList(props.board.id).then(res => {
			setParties(unwrap(res));
		}).catch(err => toastErr(err));
	}, [props.board.id]);

	function onEditClick(): void {
		console.log('press post');
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			setEditorPanelData({
				board: props.board,
				anonymous: false,
				category: '',
				title: '',
				content: {},
				bonds: [],
			});
			openEditorPanel();
		}
	}

	function SubscribeButton(): JSX.Element {
		if (has_subscribed) {
			return <div onClick={() => toggleSubscribe()} className={`${style.subscribeButton} ${style.rightSidebarButton}`}>
				<b>😭 </b>取消訂閱
			</div>;
		} else {
			return <div onClick={() => toggleSubscribe()} className={`${style.subscribeButton} ${style.rightSidebarButton}`}>
				<b>🔖 </b>訂閱看板
			</div>;
		}
	}

	return <div className="rightSideBar">
		{
			user_state.login &&
			<div className={style.rightSidebarItem}>
				<div onClick={() => onEditClick()} className={`${style.postArticleButton} ${style.rightSidebarButton}`}><b>✏️ </b>發表文章</div>
				<SubscribeButton />
			</div>
		}
		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.header}>看板簡介</div>
				<div className={style.content}>
					<ShowText text={props.board.detail} />
				</div>
				{/* <div className={style.rightSidebarButton trackBoardButton}>訂閱此看板</div> */}
			</div>
		</div>

		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.header}>政黨列表</div>
				<PartyList parties={parties}/>
			</div>
		</div>
	</div>;
}

function PartyList(props: {parties: Party[]}): JSX.Element {
	let oppositions = new Array<Party>();
	let ruling: Party | null = null;
	if (props.parties.length == 0) {
		return <></>;
	}
	for (const p of props.parties) {
		if (p.ruling) {
			ruling = p;
		} else {
			oppositions.push(p);
		}
	}
	return <>
		<div className={style.content}>
			<div className={`${style.partyItem} ${style.mainPartyItem}`}>
				<div className={style.partyTitle}>執政黨</div>
				<div className={style.partyName}>{ruling!.party_name}</div>
				<div className={style.partyScore}> {ruling!.energy} <i> ☘ </i></div>
			</div>
			{
				oppositions.map((p, idx) => {
					return <div key={p.id} className={style.partyItem}>
						<div className={style.partyTitle}>
							{idx == 0 ? '在野黨' : ''}
						</div>
						<div className={style.partyName}>{p.party_name}</div>
						<div className={style.partyScore}>{p.energy}<i> ☘ </i></div>
					</div>;
				})
			}
		</div>
		<div className={`${style.rightSidebarButton} ${style.showPartyButton}`}>顯示更多政黨</div>
	</>;
}

function UserIntroduction(props: {author: Author}): JSX.Element {
	const [user, setUser] = React.useState<User | null>(null);

	React.useEffect(() => {
		if (props.author == 'Anonymous' || props.author == 'MyAnonymous') {
			return;
		} else {
			API_FETCHER.userQuery.queryUser(props.author.NamedAuthor.name).then((user) => {
				try {
					setUser(unwrap(user));
				} catch (err) {
					toastErr(err);
				}
			});
		}
	}, [props.author]);

	if (props.author == 'Anonymous' || props.author == 'MyAnonymous') {
		return <></>;
	} else {
		const user_name = props.author.NamedAuthor.name;
		return <div className={style.userIntroduction}>
			<div className={style.userTop}>
				<img src={`/avatar/${user_name}`} />
				<div className={style.text}>
					<div className={style.name}>
						<Link to={`/app/user/${user_name}`}>{user_name}</Link>
					</div>
					{
						user ?
							<div className={style.sentence}> {user.sentence} </div>
							: <></>
					}
				</div>
			</div>
			{
				user ?
					<ProfileDetail profile_user={user} />
					: <></>
			}
		</div>;
	}
}

export function ArticleSidebar(props: {author: Author}): JSX.Element {
	return <div className="rightSideBar">
		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<UserIntroduction author={props.author} />
			</div>
		</div>

		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.advertisement}>廣告</div>
				招租中，意者請洽 <a href="mailto:c.carbonbond.c@gmail.com">c.carbonbond.c@gmail.com</a>
			</div>
		</div>
	</div>;
}