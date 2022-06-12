import * as React from 'react';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';
import { Article, Board, Party, User } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';

import style from '../../css/board/right_sidebar.module.css';
import { toastErr, useSubscribeBoard } from '../utils';
import { Link } from 'react-router-dom';
import { ProfileRelation, ProfileAction, ProfileDetail } from '../profile/user_page';
import { ShowText } from '../display/show_text';
import { AllChatState, OppositeKind, DirectChatData } from '../global_state/chat';
import { BottomPanelState } from '../global_state/bottom_panel';
import { ConfigState } from '../global_state/config';

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
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			setEditorPanelData({
				board: props.board,
				anonymous: false,
				category_name: '',
				title: '',
				value: {
					content: {},
					fields: [],
				},
				bonds: [],
			});
			openEditorPanel();
		}
	}

	function SubscribeButton(): JSX.Element {
		return <div onClick={() => toggleSubscribe()} className={`${style.subscribeButton} ${style.rightSidebarButton}`}>
			{
				has_subscribed ?
					<>😭 取消訂閱</> :
					<>🔖 訂閱看板</>
			}
		</div>;
	}

	return <div className="rightSideBar">
		{
			user_state.login &&
			<div className={style.rightSidebarItem}>
				<div onClick={() => onEditClick()} className={`${style.postArticleButton} ${style.rightSidebarButton}`}>✏️ 發表文章</div>
				<SubscribeButton />
			</div>
		}
		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.header}>關於看板</div>
				<div className={style.content}>
					<ShowText text={props.board.detail} />
				</div>
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

function UserIntroduction(props: {article: Article}): JSX.Element {
	let author = props.article.meta.author;
	const { all_chat, addDirectChat } = AllChatState.useContainer();
	const { addRoom } = BottomPanelState.useContainer();
	const [user, setUser] = React.useState<User | null>(null);
	const { user_state } = UserState.useContainer();
	const [reload, setReload] = React.useState<number>(Date.now());

	React.useEffect(() => {
		if (author == 'Anonymous' || author == 'MyAnonymous') {
			return;
		} else {
			API_FETCHER.userQuery.queryUser(author.NamedAuthor.name).then((user) => {
				try {
					setUser(unwrap(user));
				} catch (err) {
					toastErr(err);
				}
			});
		}
	}, [author, reload]);

	if (author == 'MyAnonymous') {
		return <></>;
	} else if (author == 'Anonymous') {
		return <div className={style.anonymousAuthor}>
			作者匿名，但依然可以 <button onClick={() => {
				const article_id = props.article.meta.id;
				const article_title = props.article.meta.title;
				let chat = Object.values(all_chat.direct).find(chat => {
					return chat.meta.is_fake &&
						chat.meta.opposite.kind == OppositeKind.AnonymousArticleMeta &&
						chat.meta.opposite.article_id == article_id;
				});
				// TODO: 問後端這個文章對話是否已經存在
				// 以後聊天室對話實作分頁之後，
				if (chat != undefined) {
					addRoom(chat.id);
				} else {
					let fake_direct = DirectChatData.new_fake_article(article_id, article_title);
					addDirectChat(fake_direct.id, fake_direct);
					addRoom(fake_direct.id);
				}

			}}>
				🗨️ 私訊作者
			</button>
		</div>;
	} else {
		const user_name = author.NamedAuthor.name;
		return <div className={style.userIntroduction}>
			<div className={style.userTop}>
				<div className={style.avatar}>
					<img src={`/avatar/${user_name}`} />
				</div>
				{
					user ?
						<div className={style.action}>
							<ProfileAction profile_user={user} user_state={user_state} reload={reload} setReload={setReload}/>
						</div>
						: <></>
				}
			</div>
			<div className={style.text}>
				<div className={style.name}>
					<Link to={`/app/user/${user_name}`}>{user_name}</Link>
				</div>
				{
					user ?
						<div className={style.sentence}> {user.sentence} </div>
						: <></>
				}
				{
					user ?
						<ProfileRelation profile_user={user} user_state={user_state} reload={reload}/>
						: <></>
				}
			</div>
			{
				user ?
					<div className={style.information}>
						<ProfileDetail profile_user={user} />
					</div>
					: <></>
			}
		</div>;
	}
}

export function ArticleSidebar(props: {article: Article}): JSX.Element {
	let { server_config } = ConfigState.useContainer();
	const mail = server_config.advertisement_contact_email;
	return <div className="rightSideBar">
		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<UserIntroduction article={props.article} />
			</div>
		</div>

		<div className={style.rightSidebarItem}>
			<div className={style.rightSidebarBlock}>
				<div className={style.advertisement}>廣告</div>
				{
					mail ?
						<> 招租中，意者請洽 <a href={`mailto:${mail}`}>{mail}</a> </> :
						<></>
				}
			</div>
		</div>
	</div>;
}