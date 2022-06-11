import * as React from 'react';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { useTitle } from 'react-use';
import { ArticleCard } from '../article_card';
import { Avatar } from './avatar';
import { UserCard } from './user_card';
import { UserRelationKind, User, UserMini, ArticleMetaWithBonds } from '../../ts/api/api_trait';
import { UserState, UserStateType } from '../global_state/user';
import { LocationState, UserLocation } from '../global_state/location';
import { toastErr, useInputValue } from '../utils';
import { ModalButton, ModalWindow } from '../components/modal_window';
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


function EditSentence(props: { sentence: string, setSentence: (sentence: string) => void }): JSX.Element {
	const [is_editing, setIsEditing] = React.useState<boolean>(false);
	const { input_props, setValue } = useInputValue(props.sentence);
	React.useEffect(() => {
		setValue(props.sentence);
	}, [props.sentence, setValue]);

	async function updateSentence(): Promise<void> {
		try {
			await API_FETCHER.userQuery.updateSentence(input_props.value);
			props.setSentence(input_props.value);
		} catch (err) {
			toastErr(err);
		}
		setIsEditing(false);
	}

	if (is_editing) {
		return <div>
			<input {...input_props} type="text" autoFocus />
			<div>
				<button onClick={updateSentence}>確定</button>
				<button onClick={() => { setValue(props.sentence); setIsEditing(false); }}>取消</button>
			</div>
		</div>;
	} else if (props.sentence == '') {
		return <div className={style.noSentence}>
			尚未設置一句話介紹
			<button onClick={() => setIsEditing(true)}>✏ 修改</button>
		</div>;
	} else {
		return <div className={style.sentence}>
			{props.sentence}
			<button onClick={() => setIsEditing(true)}>✏ 修改</button>
		</div>;
	}
}

function Sentence(props: { is_me: boolean, sentence: string, setSentence: ((sentence: string) => void) | null}): JSX.Element {
	if (props.is_me && props.setSentence) {
		return <EditSentence sentence={props.sentence} setSentence={props.setSentence} />;
	} else if (props.sentence == '') {
		return <div className={style.noSentence}>
			尚未設置一句話介紹
		</div>;
	} else {
		return <div className={style.sentence}>{props.sentence}</div>;
	}
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

export function ProfileDetail(props: { profile_user: User }): JSX.Element {
	const [editing, setEditing] = React.useState(false);
	let { user_state } = UserState.useContainer();
	const [introduction, setIntroduction] = React.useState<string>(props.profile_user ? props.profile_user.introduction : '');
	const [gender, setGender] = React.useState<string>(props.profile_user ? props.profile_user.gender : '');
	const [job, setJob] = React.useState<string>(props.profile_user ? props.profile_user.job : '');
	const [city, setCity] = React.useState<string>(props.profile_user ? props.profile_user.city : '');

	async function updateInformation(introduction: string, job: string, city: string): Promise<{}> {
		try {
			unwrap(await API_FETCHER.userQuery.updateInformation(introduction, job, city));
			setIntroduction(introduction);
			setJob(job);
			setCity(city);
			setEditing(false);
		} catch (err) {
			toastErr(err);
		}
		return {};
	}

	React.useEffect(() => {
		if (props.profile_user) {
			setIntroduction(props.profile_user.introduction);
			setGender(props.profile_user.gender);
			setJob(props.profile_user.job);
			setCity(props.profile_user.city);
		}
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

	return <div className={style.detail}>
		<div>
			<div className={style.introduction}>
				<div className={style.title}>自我介紹</div>
				{is_me && <button className={style.editButton} onClick={() => setEditing(true)}>✏</button>}
			</div>
			<div className={style.info}>
				<ShowText text={introduction} />
			</div>
			<div className={style.info}>
				<div className={style.item}>性別<span className={style.key}>{gender}</span></div>
				<div className={style.item}>職業為<span className={style.key}>{job}</span></div>
				<div className={style.item}>現居<span className={style.key}>{city}</span></div>
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
		</div>
		<EditModal introduction={introduction} gender={gender} birth_year={props.profile_user ? props.profile_user.birth_year : 0} job={job} city={city} />
	</div>;
}

type RelationKind = 'following' | 'hating' | 'follower' | 'hater';

function RelationModal(props: { user: User, kind: RelationKind, is_myself: boolean,
		visible: boolean, setVisible: React.Dispatch<React.SetStateAction<boolean>>, reload: number }): JSX.Element {
	const [public_users, setPublicUsers] = React.useState<UserMini[]>([]);
	const [private_users, setPrivateUsers] = React.useState<UserMini[]>([]);
	const [selectTab, setSelectTab] = React.useState<number>(0);

	React.useEffect(() => {
		setPublicUsers([]);
		setPrivateUsers([]);
		setSelectTab(0);
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

	function getBody(): JSX.Element {
		return <div className={style.userListContainer}>
			<div className={style.navigateBar}>
				<div className={style.navigateTab + (selectTab == 0 ? ` ${style.navigateTabActive}` : '')}
					onClick={() => { setSelectTab(0); }}>{(props.kind == 'follower' || props.kind == 'following') ? `喜歡 (${public_count})` : `仇視 (${public_count})`}</div>
				<div className={(!props.is_myself ? `${style.navigateTabDisable}` : (`${style.navigateTab}` + (selectTab == 1 ? ` ${style.navigateTabActive}` : '')))}
					onClick={() => { if (props.is_myself) { setSelectTab(1); } }}>{(props.kind == 'follower' || props.kind == 'following') ? `偷偷喜歡 (${private_count})` : `偷偷仇視 (${private_count})`}</div>
			</div>
			<div className={style.content}>
				{selectTab == 0 && <div>
					{public_users.length == 0 ? (
						<div className={style.emptyContainer}>
							<div>{(props.kind == 'follower' || props.kind == 'following') ? '沒有公開喜歡的人' : '沒有公開仇視的人'}</div>
						</div>
					) : (
						public_users.map(user => (
							<div className={style.friendshipWrapper} key={`friendship-${user.id}`}>
								<UserCard user={user} />
							</div>
						))
					)}
				</div>}
				{selectTab == 1 && <div>
					{private_users.length == 0 ? (
						<div className={style.emptyContainer}>
							<div>{(props.kind == 'follower' || props.kind == 'following') ? '沒有偷偷喜歡的人' : '沒有偷偷仇視的人'}</div>
						</div>
					) : (
						private_users.map(user => (
							<div className={style.friendshipWrapper} key={`friendship-${user.id}`}>
								<UserCard user={user} />
							</div>
						))
					)}
				</div>}
			</div>
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

function ProfileOverview(props: { profile_user: User, setProfileUser: React.Dispatch<React.SetStateAction<User | null>> | null,
		user_state: UserStateType,
		reload: number}): JSX.Element {

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

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;

	return <div className={style.account}>
		<div className={style.avatarContainer}>
			<Avatar is_me={is_me} name={props.profile_user.user_name} />
		</div>
		<div className={style.abstract}>
			<div className={style.username}>{props.profile_user.user_name}</div>
			<Sentence is_me={is_me} sentence={props.profile_user.sentence} setSentence={props.setProfileUser ? setSentence : null} />
			<ProfileRelation {...props}/>
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
	reload: number, setReload: React.Dispatch<React.SetStateAction<number>> }): JSX.Element {
	const [relation_type, setRelationType] = React.useState<UserRelationKind>(UserRelationKind.None);
	const [relation_public, setRelationPublic] = React.useState<boolean>(false);
	const { addRoom } = BottomPanelState.useContainer();
	const { all_chat, addDirectChat } = AllChatState.useContainer();

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;

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

	return <div className={style.operation}>
		<div className={style.links}>
			{
				props.user_state.login && props.user_state.user_name != props.profile_user.user_name ?
					<RelationEditComponent target_user_id={props.profile_user.id}
						relation_type={relation_type} setRelationType={setRelationType}
						relation_public={relation_public} setRelationPublic={setRelationPublic}
						setReload={props.setReload}/>: <></>
			}
			{
				is_me ?
					<></> :
					<button onClick={onStartChat}>🗨️ 私訊</button>
			}
			<Link style={{ textDecoration: 'none', color: 'inherit' }} to={`/app/b/personal/${props.profile_user.user_name}`}>
				<div className={style.personalBoard}>
						🤠 個板
				</div>
			</Link>
		</div>
	</div>;
}

function ProfileWorks(props: { profile_user: User, user_state: UserStateType }): JSX.Element {
	const [selectTab, setSelectTab] = React.useState<number>(0);
	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);

	React.useEffect(() => {
		Promise.all([
			fetchArticles(props.profile_user.user_name),
		]).then(([more_articles]) => {
			try {
				setArticles(more_articles);
			} catch (err) {
				toastErr(err);
			}
		});
	}, [props.profile_user.user_name]);

	function handleSelectTab(tabIndex: number): void {
		switch (tabIndex) {
			case 0:
				Promise.all([
					fetchArticles(props.profile_user.user_name),
				]).then(([more_articles]) => {
					try {
						setArticles(more_articles);
					} catch (err) {
						toastErr(err);
					}
				});
				break;
			case 1:
				break;
			case 2:
				break;
			case 3:
				break;
			default:
				break;
		}
		setSelectTab(tabIndex);
	}

	return <div className={style.works}>
		<div className={style.navigateBar}>
			<div className={style.navigateTab + (selectTab == 0 ? ` ${style.navigateTabActive}` : '')} onClick={() => { handleSelectTab(0); }}>文章</div>
			{/* 暫時不顯示一個帳號的所有留言 */}
			{/* <div className={style.navigateTab + (selectTab == 1 ? ` ${style.navigateTabActive}` : '')} onClick={() => { handleSelectTab(1); }}>留言</div> */}
			<div className={style.navigateTab + (selectTab == 2 ? ` ${style.navigateTabActive}` : '')} onClick={() => { handleSelectTab(2); }}>收藏</div>
		</div>
		<div className={style.content}>
			{selectTab == 0 && <Articles articles={articles} />}
			{/* {selectTab == 1 && <Comments />} */}
			{selectTab == 2 && <Favorites profile_user={props.profile_user} />}
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
		setCurrentLocation(new UserLocation(user_name));
	}, [setCurrentLocation, user_name]);
	useTitle(`卷宗 | ${user_name}`);

	if (!user) {
		return <></>;
	}
	return <div>
		<div className={style.up}>
			<div className={style.profileOverviewWrap}>
				<ProfileOverview profile_user={user} setProfileUser={setUser} user_state={user_state} reload={reload}/>
			</div>
			<div className={style.profileActionWrap}>
				<ProfileAction profile_user={user} user_state={user_state} reload={reload} setReload={setReload}/>
			</div>
		</div>
		<div className={style.down}>
			<ProfileWorks profile_user={user} user_state={user_state} />
			<div className={style.profileDetailWrap}>
				<ProfileDetail profile_user={user} />
			</div>
		</div>
	</div>;
}

function KeepAliveUserPage(): JSX.Element {
	let history = createBrowserHistory();
	return <KeepAlive name={history.location.key} id={history.location.key}>
		<UserPage />
	</KeepAlive>;
}

export {
	KeepAliveUserPage
};