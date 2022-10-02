import * as React from 'react';
import { API_FETCHER, unwrap_or, unwrap } from 'carbonbond-api/api_utils';
import { useTitle } from 'react-use';
import { ArticleCard } from '../article_card';
import { Avatar } from './avatar';
import { UserCard } from './user_card';
import { UserRelationKind, User, UserMini, ArticleMetaWithBonds, Board, BoardType } from 'carbonbond-api/api_trait';
import { UserState, UserStateType } from '../global_state/user';
import { LocationState, UserLocation } from '../global_state/location';
import { toastErr, useInputValue } from '../utils';
import { ModalButton, ModalWindow } from '../components/modal_window';
import { TabPanel, TabPanelItem } from '../components/tab_panel';
import { AllChatState, DirectChatData } from '../global_state/chat';
import { BottomPanelState } from '../global_state/bottom_panel';
import { InvalidMessage } from '../../tsx/components/invalid_message';
import { ShowText } from '../display/show_text';
import { createBrowserHistory } from 'history';

import aritcle_wrapper_style from '../../css/article_wrapper.module.css';
const { articleWrapper } = aritcle_wrapper_style;
import style from '../../css/user_page.module.css';
import produce from 'immer';
import { Link, useParams } from 'react-router-dom';
import { KeepAlive } from 'react-activation';


function Sentence(props: { profile_user: User,
		user_state: UserStateType,
		setProfileUser: React.Dispatch<React.SetStateAction<User | null>> | null }): JSX.Element {
	function setSentence(sentence: string): void {
		let new_state = produce(props.profile_user, nxt => {
			if (nxt != null) {
				nxt.sentence = sentence;
			}
		});
		if (props.setProfileUser) {
			props.setProfileUser(new_state);
		}
	}

	if (!props.user_state.login) {
		return <></>;
	}

	return <div className={style.sentenceComponent}>
		{props.profile_user.sentence == '' ? <div className={style.noSentence}>
			尚無一句話介紹
		</div> : <div className={style.sentence}>
			{props.profile_user.sentence}
		</div> }
		{props.user_state.user_name == props.profile_user.user_name && <div className={style.links}>
			<SentenceEditComponent profile_user={props.profile_user}
				setSentence={setSentence}/>
		</div>}
	</div>;
}

import 律師圖標 from '../../img/title/律師.png';
import 站方代表圖標 from '../../img/title/站方代表.png';

const TITLE_IMAGE_MAPPING: {[index: string]: string} = {
	'律師': 律師圖標,
	'站方代表': 站方代表圖標
};

function CertificationItem(props: { title: string }) : JSX.Element {
	let image_url = TITLE_IMAGE_MAPPING[props.title];
	return <span className={style.titleLabel}>
		<span className={style.titleBlock}>
			{
				image_url ?
					<img src={image_url} className={style.titleImage} /> :
					<></>
			}
			<span className={style.titleText}>{props.title}</span>
		</span>
	</span>;
}

function PersonalBoardCard(props: { board: Board }) : JSX.Element {
	const [subscribe_count, setSubscribeCount] = React.useState<number>(0);

	React.useEffect(() => {
		API_FETCHER.boardQuery.querySubscribedUserCount(props.board.id).then(count => {
			try {
				setSubscribeCount(unwrap(count));
			} catch (err) {
				return Promise.reject(err);
			}
		}).catch(err => {
			console.error(err);
		});
	}, [props.board]);

	return <div className={style.boardCard}>
		<div className={style.boardName}>
			{props.board.board_name} (個版)
		</div>
		<div className={style.boardTitle}>
			{props.board.title}
		</div>
		<div className={style.boardStatistics}>
			<span>{subscribe_count} 訂閱</span>
			<span> · </span>
			<span>本日 {props.board.popularity} 篇文</span>
		</div>
	</div>;
}

export function ProfileDetail(props: { profile_user: User, setProfileUser: React.Dispatch<React.SetStateAction<User | null>>}): JSX.Element {
	const [editing, setEditing] = React.useState(false);
	let { user_state } = UserState.useContainer();
	const [fetching, setFetching] = React.useState(true);
	const [board, setBoard] = React.useState<Board | null>(null);

	async function updateInformation(introduction: string, job: string, city: string): Promise<{}> {
		try {
			unwrap(await API_FETCHER.userQuery.updateInformation(introduction, job, city));
			let new_state = produce(props.profile_user, nxt => {
				if (nxt != null) {
					nxt.introduction = introduction;
					nxt.job = job;
					nxt.city = city;
				}
			});
			props.setProfileUser(new_state);
			setEditing(false);
		} catch (err) {
			toastErr(err);
		}
		return {};
	}

	React.useEffect(() => {
		API_FETCHER.boardQuery.queryBoard(props.profile_user.user_name, BoardType.Personal).then(res => {
			try {
				let board = unwrap(res);
				setBoard(board);
			} catch (err) {
				setBoard(null);
				return Promise.reject(err);
			}
		}).catch(err => {
			console.error(err);
		}).finally(() => {
			setFetching(false);
		});
	}, [props.profile_user]);

	function EditModal(props: { introduction: string, gender: string, birth_year: number, job: string, city: string }): JSX.Element {
		const [introduction, setIntroduction] = React.useState<string>(props.introduction);
		const [gender, setGender] = React.useState<string>(props.gender);
		const [job, setJob] = React.useState<string>(props.job);
		const [city, setCity] = React.useState<string>(props.city);
		const [validate_info, setValidateInfo] = React.useState<undefined | string>(undefined);

		function onIntroductionChange(introduction: string) : void {
			const length = [...introduction].length;
			setIntroduction(introduction);
			if (length > 1000) {
				setValidateInfo('字數超過 1000 上限');
			} else {
				setValidateInfo(undefined);
			}
		}

		function getBody(): JSX.Element {
			return <div className={style.editModal}>
				<div className={style.label}>自我介紹</div>
				<textarea placeholder="自我介紹" autoFocus value={introduction} onChange={(e) => onIntroductionChange(e.target.value)} />
				{validate_info && <InvalidMessage msg={validate_info} />}
				<div className={style.label}>性別</div>
				<div className={style.gender}>
					<input type="radio" disabled name="gender" value="男" defaultChecked={gender === '男'} onChange={(e) => setGender(e.target.value)} />
					<label>男</label>
					<input type="radio" disabled name="gender" value="女" defaultChecked={gender === '女'} onChange={(e) => setGender(e.target.value)} />
					<label>女</label>
				</div>
				<div className={style.label}>生年</div>
				<input type="number" disabled value={props.birth_year} />
				<div className={style.label}>職業</div>
				<input type="text" placeholder="職業" value={job} onChange={(e) => setJob(e.target.value)} />
				<div className={style.label}>居住城市</div>
				<input type="text" placeholder="居住城市" value={city} onChange={(e) => setCity(e.target.value)} />
			</div>;
		}

		let buttons: ModalButton[] = [];
		buttons.push({ text: '儲存', handler: () => updateInformation(introduction, job, city) });
		buttons.push({ text: '取消', handler: () => setEditing(false) });

		return <ModalWindow
			title="✏️ 編輯我的資料"
			body={getBody()}
			buttons={buttons}
			visible={editing}
			setVisible={setEditing}
		/>;
	}

	const is_me = user_state.login && user_state.user_name == props.profile_user.user_name;

	if (fetching) {
		return <></>;
	}

	return <div className={window.is_mobile ? style.detailMobile : style.detail}>
		{
			!window.is_mobile ? <div className={style.introduction}>
				<div className={style.title}>自我介紹</div>
				{is_me && <button className={style.editButton} onClick={() => setEditing(true)}>✏</button>}
			</div> : <></>
		}
		{
			props.profile_user.introduction ? <div className={style.info}>
				<ShowText text={props.profile_user.introduction} />
			</div> : <div className={style.noSentence}>
				尚無自我介紹
			</div>
		}
		{
			board ? <div className={style.info}>
				<Link style={{ textDecoration: 'none', color: 'inherit' }} to={`/app/b/personal/${props.profile_user.user_name}`}>
					<PersonalBoardCard board={board} />
				</Link>
			</div> : <></>
		}
		<div className={style.info}>
			<div className={style.item}>性別 <span className={style.key}>{props.profile_user.gender}</span></div>
			<div className={style.item}>職業為 <span className={style.key}>{props.profile_user.job}</span></div>
			<div className={style.item}>現居 <span className={style.key}>{props.profile_user.city}</span></div>
		</div>
		<div className={style.titleCertificate}>
			<div className={style.item}>已認證稱號：</div>
			{!props.profile_user.titles || props.profile_user.titles === '' ?
				<div className={style.title_empty}>
					無
				</div>
				: props.profile_user.titles.split(',').map(title => (
					<CertificationItem title={title} key={`${title}`}/>
				))}
		</div>
		<EditModal introduction={props.profile_user.introduction}
			gender={props.profile_user.gender}
			birth_year={props.profile_user.birth_year}
			job={props.profile_user.job}
			city={props.profile_user.city} />
	</div>;
}

type RelationKind = 'following' | 'hating' | 'follower' | 'hater';

function RelationModal(props: { user: User, kind: RelationKind, is_myself: boolean,
		visible: boolean, setVisible: React.Dispatch<React.SetStateAction<boolean>>, reload: number }): JSX.Element {
	const [public_users, setPublicUsers] = React.useState<UserMini[]>([]);
	const [private_users, setPrivateUsers] = React.useState<UserMini[]>([]);

	React.useEffect(() => {
		setPublicUsers([]);
		setPrivateUsers([]);
		if (props.kind == 'following' || props.kind == 'hating') {
			let fetchUsers = props.kind == 'following' ? fetchPublicFollowings : fetchPublicHatings;
			fetchUsers(props.user.id)
			.then((public_results) => {
				setPublicUsers(public_results);
			}).catch(err => {
				toastErr(err);
			});

			// 僅在自己的個人頁請求偷偷喜歡、仇視的人
			if (props.is_myself) {
				let fetchUsers = props.kind == 'following' ? fetchMyPrivateFollowings : fetchMyPrivateHatings;
				fetchUsers().then(private_results => {
					setPrivateUsers(private_results);
				}).catch(err => {
					toastErr(err);
				});
			}
		} else {
			let fetchUsers = props.kind == 'follower' ? fetchPublicFollowers : fetchPublicHaters;
			fetchUsers(props.user.id).then((users) => {
				try {
					setPublicUsers(users);
				} catch (err) {
					toastErr(err);
				}
			});
		}
	}, [props.user, props.kind, props.is_myself, props.reload]);

	let public_count = 0;
	let private_count = 0;
	switch (props.kind) {
		case 'follower':
			public_count = props.user.follower_count_public;
			private_count = props.user.follower_count_private;
			break;
		case 'hater':
			public_count = props.user.hater_count_public;
			private_count = props.user.hater_count_private;
			break;
		case 'following':
			public_count = props.user.following_count_public;
			private_count = props.user.following_count_private;
			break;
		default:
			public_count = props.user.hating_count_public;
			private_count = props.user.hating_count_private;
			break;
	}

	function UserList(props: {users: UserMini[], empty_string: string}): JSX.Element {
		if (props.users.length == 0) {
			return <div>
				<div className={style.emptyContainer}>
					<div>{props.empty_string}</div>
				</div>
			</div>;
		}
		return <div>
			{props.users.map(user => (
				<div className={style.friendshipWrapper} key={`friendship-${user.id}`}>
					<UserCard user={user} />
				</div>
			))}
		</div>;
	}

	function getBody(): JSX.Element {
		return <div className={style.userListContainer}>
			<TabPanel>
				<TabPanelItem is_disable={false} title={(props.kind == 'follower' || props.kind == 'following') ? `喜歡 (${public_count})` : `仇視 (${public_count})`}
					element={<UserList users={public_users} empty_string={(props.kind == 'follower' || props.kind == 'following') ? '沒有公開喜歡的人' : '沒有公開仇視的人'}/>} />
				<TabPanelItem is_disable={!props.is_myself} title={(props.kind == 'follower' || props.kind == 'following') ? `偷偷喜歡 (${private_count})` : `偷偷仇視 (${private_count})`}
					element={<UserList users={private_users} empty_string={(props.kind == 'follower' || props.kind == 'following') ? '沒有偷偷喜歡的人' : '沒有偷偷仇視的人'}/>} />
			</TabPanel>
		</div>;
	}

	let buttons: ModalButton[] = [];
	let kind_text: string;
	switch (props.kind) {
		case 'follower':
			kind_text = `喜歡 ${props.user.user_name} 的人`;
			break;
		case 'hater':
			kind_text = `仇視 ${props.user.user_name} 的人`;
			break;
		case 'following':
			kind_text = `${props.user.user_name} 喜歡的人`;
			break;
		default:
			kind_text = `${props.user.user_name} 仇視的人`;
			break;
	}

	return <ModalWindow
		title={kind_text}
		body={getBody()}
		buttons={buttons}
		visible={props.visible}
		setVisible={props.setVisible}
	/>;
}

function RelationEditModal(props: {target_user_id: number,
			relation_type: UserRelationKind, setRelationType: React.Dispatch<React.SetStateAction<UserRelationKind>>,
			relation_public: boolean, setRelationPublic: React.Dispatch<React.SetStateAction<boolean>>,
			visible: boolean, setVisible: React.Dispatch<React.SetStateAction<boolean>>,
			setReload: React.Dispatch<React.SetStateAction<number>>}) : JSX.Element {
	const [new_relation_type, setNewRelationType] = React.useState<UserRelationKind>(props.relation_type);
	const [new_relation_public, setNewRelationPublic] = React.useState<boolean>(props.relation_public);

	React.useEffect(() => {
		setNewRelationType(props.relation_type);
		setNewRelationPublic(props.relation_public);
	}, [props.relation_type, props.relation_public]);

	function getBody(): JSX.Element {
		return <div className={style.relationEditModal}>
			<label>
				<input
					type="radio"
					value={'無關係'}
					checked={new_relation_type === UserRelationKind.None}
					onChange={() => {setNewRelationType(UserRelationKind.None); setNewRelationPublic(true); }}
				/>
				<span>無關係</span>
			</label>
			<label>
				<input
					type="radio"
					value={'公開喜歡'}
					checked={new_relation_type === UserRelationKind.Follow && new_relation_public === true}
					onChange={() => {setNewRelationType(UserRelationKind.Follow); setNewRelationPublic(true); }}
				/>
				<span>公開喜歡</span>
			</label>
			<label>
				<input
					type="radio"
					value={'偷偷喜歡'}
					checked={new_relation_type === UserRelationKind.Follow && new_relation_public === false}
					onChange={() => {setNewRelationType(UserRelationKind.Follow); setNewRelationPublic(false); }}
				/>
				<span>偷偷喜歡</span>
			</label>
			<label>
				<input
					type="radio"
					value={'公開仇視'}
					checked={new_relation_type === UserRelationKind.Hate && new_relation_public === true}
					onChange={() => {setNewRelationType(UserRelationKind.Hate); setNewRelationPublic(true); }}
				/>
				<span>公開仇視</span>
			</label>
			<label>
				<input
					type="radio"
					value={'偷偷仇視'}
					checked={new_relation_type === UserRelationKind.Hate && new_relation_public === false}
					onChange={() => {setNewRelationType(UserRelationKind.Hate); setNewRelationPublic(false); }}
				/>
				<span>偷偷仇視</span>
			</label>
		</div>;
	}

	async function createUserRelation(kind: UserRelationKind, is_public: boolean): Promise<{}> {
		try {
			await API_FETCHER.userQuery.createUserRelation(props.target_user_id, kind, is_public);
		} catch (err) {
			toastErr(err);
		}
		return {};
	}

	async function deleteUserRelation(): Promise<{}> {
		try {
			await API_FETCHER.userQuery.deleteUserRelation(props.target_user_id);
		} catch (err) {
			toastErr(err);
		}
		return {};
	}

	function onChangeRelation(kind: UserRelationKind, is_public: boolean): void {
		if (kind === UserRelationKind.None && kind != props.relation_type) {
			deleteUserRelation();
			props.setRelationType(UserRelationKind.None);
			props.setRelationPublic(true);
			props.setReload(Date.now());
		} else if (props.relation_type !== kind || props.relation_public !== is_public) {
			createUserRelation(kind, is_public);
			props.setRelationType(kind);
			props.setRelationPublic(is_public);
			props.setReload(Date.now());
		}
		props.setVisible(false);
	}

	function onCancel(): void {
		setNewRelationType(props.relation_type);
		setNewRelationPublic(props.relation_public);
		props.setVisible(false);
	}

	let buttons: ModalButton[] = [];
	buttons.push({ text: '儲存', handler: () => onChangeRelation(new_relation_type, new_relation_public) });
	buttons.push({ text: '取消', handler: () => onCancel() });

	return <ModalWindow
		title={'更改關係'}
		body={getBody()}
		buttons={buttons}
		visible={props.visible}
		setVisible={props.setVisible}
		onCancel={onCancel}
	/>;
}

function RelationEditComponent(props: {target_user_id: number,
			relation_type: UserRelationKind, setRelationType: React.Dispatch<React.SetStateAction<UserRelationKind>>,
			relation_public: boolean, setRelationPublic: React.Dispatch<React.SetStateAction<boolean>>,
			setReload: React.Dispatch<React.SetStateAction<number>>}) : JSX.Element {
	const [visible, setVisible] = React.useState<boolean>(false);
	function getButtonText() : string {
		if (props.relation_type === UserRelationKind.None) {
		} else if (props.relation_type === UserRelationKind.Follow && props.relation_public) {
			return '公開喜歡中';
		} else if (props.relation_type === UserRelationKind.Follow && !props.relation_public) {
			return '偷偷喜歡中';
		} else if (props.relation_type === UserRelationKind.Hate && props.relation_public) {
			return '公開仇視中';
		} else if (props.relation_type === UserRelationKind.Hate && !props.relation_public) {
			return '偷偷仇視中';
		}
		return '建立關係';
	}
	return <div className={style.relationEditComponent}>
		<button onClick={() => setVisible(true)}>{getButtonText()}</button>
		<RelationEditModal visible={visible} setVisible={setVisible} {...props}/>
	</div>;
}

function SentenceEditModal(props: {
			profile_user: User,
			visible: boolean,
			setVisible: React.Dispatch<React.SetStateAction<boolean>>,
			setSentence: ((sentence: string) => void)}) : JSX.Element {
	const { input_props, setValue } = useInputValue(props.profile_user.sentence);

	React.useEffect(() => {
		setValue(props.profile_user.sentence);
	}, [props.profile_user.sentence, setValue]);

	function getBody(): JSX.Element {
		return <div>
			<input {...input_props} type="text" autoFocus />
		</div>;
	}

	async function onChangeSentence(sentence: string): Promise<void> {
		try {
			await API_FETCHER.userQuery.updateSentence(sentence);
			props.setSentence(sentence);
		} catch (err) {
			toastErr(err);
		}
		props.setVisible(false);
	}

	function onCancel(): void {
		props.setVisible(false);
	}

	let buttons: ModalButton[] = [];
	buttons.push({ text: '儲存', handler: () => onChangeSentence(input_props.value) });
	buttons.push({ text: '取消', handler: () => onCancel() });

	return <ModalWindow
		title={'✏ 編輯'}
		body={getBody()}
		buttons={buttons}
		visible={props.visible}
		setVisible={props.setVisible}
		onCancel={onCancel}
	/>;
}


function SentenceEditComponent(props: {profile_user: User, setSentence: ((sentence: string) => void)}) : JSX.Element {
	const [visible, setVisible] = React.useState<boolean>(false);
	return <div className={style.sentenceEditComponent}>
		<button onClick={() => setVisible(true)}>✏ 編輯</button>
		<SentenceEditModal visible={visible} setVisible={setVisible} {...props}/>
	</div>;
}

function ProfileOverview(props: { profile_user: User,
		setProfileUser: React.Dispatch<React.SetStateAction<User | null>> | null,
		user_state: UserStateType,
		reload: number,
		setReload: React.Dispatch<React.SetStateAction<number>> }): JSX.Element {

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;

	return <div className={style.account}>
		<div className={style.avatarContainer}>
			<Avatar is_me={is_me} name={props.profile_user.user_name} />
		</div>
		<div className={style.abstract}>
			<div className={style.username}>{props.profile_user.user_name}</div>
			<Sentence profile_user={props.profile_user}
				user_state={props.user_state}
				setProfileUser={props.setProfileUser}/>
			<ProfileAction profile_user={props.profile_user}
				user_state={props.user_state}
				reload={props.reload}
				setReload={props.setReload}
				setProfileUser={props.setProfileUser}/>
		</div>
	</div>;
}

export function ProfileRelation(props: {profile_user: User,
		user_state: UserStateType,
		reload: number}): JSX.Element {
	const [visible_follower, setVisibleFollower] = React.useState<boolean>(false);
	const [visible_hater, setVisibleHater] = React.useState<boolean>(false);
	const [visible_following, setVisibleFollowing] = React.useState<boolean>(false);
	const [visible_hating, setVisibleHating] = React.useState<boolean>(false);

	React.useEffect(() => {
		setVisibleFollower(false);
		setVisibleHater(false);
		setVisibleFollowing(false);
		setVisibleHating(false);
	}, [props.profile_user, props.user_state.login, props.reload]);

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;
	const total_follower = props.profile_user.follower_count_public + props.profile_user.follower_count_private;
	const total_following = props.profile_user.following_count_public + props.profile_user.following_count_private;
	const total_hater = props.profile_user.hater_count_public + props.profile_user.hater_count_private;
	const total_hating = props.profile_user.hating_count_public + props.profile_user.hating_count_private;

	return <div className={style.relationdata}>
		<div className={style.energy}>
			<span className={style.icon}>☘️</span>
			<span>{props.profile_user.energy} 鍵能</span>
		</div>
		<div className={style.follow}>
			<span className={style.icon}>❤️</span>
			<span className={style.relationLink} onClick={() => setVisibleFollower(true)}>被 {total_follower} 人喜歡</span>
			<span> · </span>
			<span className={style.relationLink} onClick={() => setVisibleFollowing(true)}>喜歡 {total_following} 人</span>
		</div>
		<div className={style.hate}>
			<span className={style.icon}>💢</span>
			<span className={style.relationLink} onClick={() => setVisibleHater(true)}>被 {total_hater} 人仇視</span>
			<span> · </span>
			<span className={style.relationLink} onClick={() => setVisibleHating(true)}>仇視 {total_hating} 人</span>
		</div>
		<RelationModal user={props.profile_user} kind="follower"  is_myself={false} visible={visible_follower} setVisible={setVisibleFollower} reload={props.reload} />
		<RelationModal user={props.profile_user} kind="hater"     is_myself={false} visible={visible_hater} setVisible={setVisibleHater} reload={props.reload} />
		<RelationModal user={props.profile_user} kind="following" is_myself={is_me} visible={visible_following} setVisible={setVisibleFollowing} reload={props.reload} />
		<RelationModal user={props.profile_user} kind="hating"    is_myself={is_me} visible={visible_hating} setVisible={setVisibleHating} reload={props.reload} />
	</div>;
}

export function ProfileAction(props: {profile_user: User,
	user_state: UserStateType,
	reload: number,
	setReload: React.Dispatch<React.SetStateAction<number>>
	setProfileUser: React.Dispatch<React.SetStateAction<User | null>> | null}): JSX.Element {
	const [relation_type, setRelationType] = React.useState<UserRelationKind>(UserRelationKind.None);
	const [relation_public, setRelationPublic] = React.useState<boolean>(false);
	const { addRoom } = BottomPanelState.useContainer();
	const { all_chat, addDirectChat } = AllChatState.useContainer();

	React.useEffect(() => {
		async function queryUserRelation(): Promise<{}> {
			if (props.profile_user) {
				try {
					await API_FETCHER.userQuery.queryUserRelation(props.profile_user.id).then((res) => {
						setRelationType(unwrap(res).kind);
						setRelationPublic(unwrap(res).is_public);
					});
				} catch (err) {
					toastErr(err);
				}
			}
			return {};
		}
		if (props.profile_user && props.user_state.login) {
			queryUserRelation();
		}
	}, [props.profile_user, props.user_state.login, props.reload]);

	function onStartChat(): void {
		const user_name = props.profile_user.user_name;
		const user_id = props.profile_user.id;
		let chat = Object.values(all_chat.direct).find(chat => chat.name == user_name);
		if (chat != undefined) {
			addRoom(chat.id);
		} else {
			let fake_direct = DirectChatData.new_fake_direct(user_id, user_name);
			addDirectChat(fake_direct.id, fake_direct);
			addRoom(fake_direct.id);
		}
	}

	if (!props.user_state.login || props.user_state.user_name == props.profile_user.user_name) {
		return <></>;
	}

	return <div className={style.operation}>
		<div className={style.links}>
			<div className={style.linkButton}>
				<RelationEditComponent target_user_id={props.profile_user.id}
					relation_type={relation_type} setRelationType={setRelationType}
					relation_public={relation_public} setRelationPublic={setRelationPublic}
					setReload={props.setReload}/>
			</div>
			<div className={style.linkButton}>
				<button onClick={onStartChat}>🗨️ 私訊</button>
			</div>
		</div>
	</div>;
}

function Articles(props: { articles: ArticleMetaWithBonds[] }): JSX.Element {
	return <div>
		{props.articles.map(article => (
			<div className={articleWrapper} key={`article-${article.meta.id}`}>
				<ArticleCard article={article.meta} bonds={article.bonds} />
			</div>
		))}
	</div>;
}

function Favorites(props: { profile_user: User }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [favorites, setFavorites] = React.useState<ArticleMetaWithBonds[]>([]);

	React.useEffect(() => {
		// TODO change fetchFavorites to get a user_id as parameter
		fetchFavorites()
			.then((more_favorites) => {
				try {
					if (user_state.login && props.profile_user.user_name == user_state.user_name) {
						setFavorites(more_favorites);
					} else {
						setFavorites([]);
					}
				} catch (err) {
					toastErr(err);
				}
			});
	}, [props.profile_user.user_name, user_state]);

	return <div>
		{favorites.map(favorite => (
			<div className={articleWrapper} key={`article-${favorite.meta.id}`} >
				<ArticleCard article={favorite.meta} bonds={favorite.bonds} />
			</div>
		))}
	</div>;
}

// function Comments(): JSX.Element {
// 	return <div>留言</div>;
// }

async function fetchArticles(
	author_name: string,
): Promise<ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.articleQuery.searchArticle(author_name, null, null, null, null, null, new Map()), []);
}

async function fetchFavorites(): Promise<ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryMyFavoriteArticleList(), []);
}

async function fetchPublicFollowers(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryPublicFollowerList(user_id), []);
}

async function fetchPublicHaters(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryPublicHaterList(user_id), []);
}

async function fetchPublicFollowings(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryPublicFollowingList(user_id), []);
}

async function fetchPublicHatings(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryPublicHatingList(user_id), []);
}

async function fetchMyPrivateFollowings(): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryMyPrivateFollowingList(), []);
}

async function fetchMyPrivateHatings(): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryMyPrivateHatingList(), []);
}

function UserPage(): JSX.Element {
	let params = useParams<{user_name: string}>();
	const user_name = params.user_name!;
	const { user_state } = UserState.useContainer();
	const [reload, setReload] = React.useState<number>(Date.now());

	const [user, setUser] = React.useState<User | null>(null);
	const { setCurrentLocation } = LocationState.useContainer();

	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);

	React.useEffect(() => {
		API_FETCHER.userQuery.queryUser(user_name).then((user) => {
			try {
				setUser(unwrap(user));
			} catch (err) {
				toastErr(err);
			}
		});
	}, [user_name, reload]);

	React.useEffect(() => {
		fetchArticles(user_name).then(articles => {
			try {
				setArticles(articles);
			} catch (err) {
				toastErr(err);
			}
		});
	}, [user_name]);

	React.useEffect(() => {
		setCurrentLocation(new UserLocation(user_name));
	}, [setCurrentLocation, user_name]);
	useTitle(`卷宗 | ${user_name}`);

	if (!user) {
		return <></>;
	}
	return <div>
		<div className={style.up}>
			<div className={style.profileOverviewWrap}>
				<ProfileOverview profile_user={user} setProfileUser={setUser} user_state={user_state} reload={reload} setReload={setReload}/>
			</div>
			<div className={style.profileActionWrap}>
				<ProfileRelation profile_user={user} user_state={user_state} reload={reload}/>
			</div>
		</div>
		<div className={style.down}>
			<div className={style.profileTabWrap}>
				<div className={style.profileTabPanel}>
					{window.is_mobile ? <TabPanel>
						<TabPanelItem title="自我介紹" is_disable={false} element={<ProfileDetail profile_user={user} setProfileUser={setUser} />}/>
						<TabPanelItem title="文章" is_disable={false} element={<Articles articles={articles} />}/>
						<TabPanelItem title="收藏" is_disable={false} element={<Favorites profile_user={user} />}/>
					</TabPanel> : <TabPanel>
						<TabPanelItem title="文章" is_disable={false} element={<Articles articles={articles} />}/>
						<TabPanelItem title="收藏" is_disable={false} element={<Favorites profile_user={user} />}/>
					</TabPanel>}
				</div>
			</div>
			{window.is_mobile ? <></> : <div className={style.profileDetailWrap}>
				<ProfileDetail profile_user={user} setProfileUser={setUser} />
			</div> }
		</div>
	</div>;
}

function KeepAliveUserPage(): JSX.Element {
	let history = createBrowserHistory();
	return <KeepAlive cacheKey="UserPage" name={history.location.key} id={history.location.key}>
		<UserPage />
	</KeepAlive>;
}

export {
	KeepAliveUserPage,
	Sentence
};