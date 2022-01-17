import * as React from 'react';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { relativeDate } from '../../ts/date';
import { RouteComponentProps } from 'react-router';
import { ArticleCard } from '../article_card';
import { Avatar } from './avatar';
import { UserCard } from './user_card';
import { UserRelationKind, User, UserMini, ArticleMeta, Favorite } from '../../ts/api/api_trait';
import { UserState, UserStateType } from '../global_state/user';
import { toastErr, useInputValue } from '../utils';
import { ModalButton, ModalWindow } from '../components/modal_window';
import { AllChatState, DirectChatData } from '../global_state/chat';
import { BottomPanelState } from '../global_state/bottom_panel';

import aritcle_wrapper_style from '../../css/article_wrapper.module.css';
const { articleWrapper } = aritcle_wrapper_style;
import favorite_wrapper_style from '../../css/favorite_wrapper.module.css';
const { favoriteTitle, favoriteWrapper } = favorite_wrapper_style;
import style from '../../css/user_page.module.css';
import produce from 'immer';

function EditSentence(props: { sentence: string, setSentence: Function }): JSX.Element {
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
			<button onClick={() => setIsEditing(true)}>🖉 修改</button>
		</div>;
	} else {
		return <div className={style.sentence}>
			{props.sentence}
			<button onClick={() => setIsEditing(true)}>🖉 修改</button>
		</div>;
	}
}

function Sentence(props: { is_me: boolean, sentence: string, setSentence: Function }): JSX.Element {
	if (props.is_me) {
		return <EditSentence sentence={props.sentence} setSentence={props.setSentence} />;
	} else if (props.sentence == '') {
		return <div className={style.noSentence}>
			尚未設置一句話介紹
		</div>;
	} else {
		return <div className={style.sentence}>{props.sentence}</div>;
	}
}

function ProfileDetail(props: { profile_user: User, user_state: UserStateType }): JSX.Element {
	const [editing, setEditing] = React.useState(false);
	const [introduction, setIntroduction] = React.useState<string>(props.profile_user ? props.profile_user.introduction : '');
	const [gender, setGender] = React.useState<string>(props.profile_user ? props.profile_user.gender : '');
	const [job, setJob] = React.useState<string>(props.profile_user ? props.profile_user.job : '');
	const [city, setCity] = React.useState<string>(props.profile_user ? props.profile_user.city : '');

	async function updateInformation(introduction: string, gender: string, job: string, city: string): Promise<{}> {
		console.log('更新我的資料');
		try {
			await API_FETCHER.userQuery.updateInformation(introduction, gender, job, city);
			setIntroduction(introduction);
			setGender(gender);
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

	function EditModal(props: { introduction: string, gender: string, job: string, city: string }): JSX.Element {
		const [introduction, setIntroduction] = React.useState<string>(props.introduction);
		const [gender, setGender] = React.useState<string>(props.gender);
		const [job, setJob] = React.useState<string>(props.job);
		const [city, setCity] = React.useState<string>(props.city);

		function getBody(): JSX.Element {
			return <div className={style.editModal}>
				<div className={style.label}>自我介紹</div>
				<textarea placeholder="自我介紹" autoFocus value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
				<div className={style.label}>性別</div>
				<div className={style.gender}>
					<input type="radio" name="gender" value="男" defaultChecked={gender === '男'} onChange={(e) => setGender(e.target.value)} />
					<label>男</label>
					<input type="radio" name="gender" value="女" defaultChecked={gender === '女'} onChange={(e) => setGender(e.target.value)} />
					<label>女</label>
				</div>
				<div className={style.label}>職業</div>
				<input type="text" placeholder="職業" value={job} onChange={(e) => setJob(e.target.value)} />
				<div className={style.label}>居住城市</div>
				<input type="text" placeholder="居住城市" value={city} onChange={(e) => setCity(e.target.value)} />
			</div>;
		}

		let buttons: ModalButton[] = [];
		buttons.push({ text: '儲存', handler: () => updateInformation(introduction, gender, job, city) });
		buttons.push({ text: '取消', handler: () => setEditing(false) });

		return <ModalWindow
			title="🖉 編輯我的資料"
			body={getBody()}
			buttons={buttons}
			visible={editing}
			setVisible={setEditing}
		/>;
	}

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;

	return <div className={style.detail}>
		<div>
			<div className={style.introduction}>
				<div className={style.title}>自我介紹</div>
				{is_me && <button className={style.editButton} onClick={() => setEditing(true)}>🖉</button>}
			</div>
			<div className={style.info}>
				<div className={style.item}>{introduction}</div>
			</div>
			<div className={style.info}>
				<div className={style.item}>性別<span className={style.key}>{gender}</span></div>
				<div className={style.item}>職業為<span className={style.key}>{job}</span></div>
				<div className={style.item}>現居<span className={style.key}>{city}</span></div>
			</div>
		</div>
		<EditModal introduction={introduction} gender={gender} job={job} city={city} />
	</div>;
}

function RelationModal(props: { user: User, kind: string, is_myself: boolean, visible: boolean, setVisible: Function }): JSX.Element {
	const [public_users, setPublicUsers] = React.useState<UserMini[]>([]);
	const [private_users, setPrivateUsers] = React.useState<UserMini[]>([]);
	const [selectTab, setSelectTab] = React.useState<number>(0);

	React.useEffect(() => {
		if (props.kind == 'following' || props.kind == 'hating') {
			let fetchUsers = props.kind == 'following' ? fetchFollowings : fetchHatings;
			Promise.all([
				fetchUsers(props.user.id, true, props.is_myself),
				fetchUsers(props.user.id, false, props.is_myself),
			]).then(([public_results, private_results]) => {
				try {
					setPublicUsers(public_results);
					setPrivateUsers(private_results);
				} catch (err) {
					toastErr(err);
				}
			});
		} else {
			let fetchUsers = props.kind == 'follower' ? fetchFollowers : fetchHaters;
			fetchUsers(props.user.id).then((users) => {
				try {
					setPublicUsers(users);
				} catch (err) {
					toastErr(err);
				}
			});
		}
	}, [props.user, props.kind, props.is_myself]);

	let public_count = 0;
	let private_count = 0;
	switch (props.kind) {
		case 'follower':
			public_count = props.user.followed_count_public;
			private_count = props.user.followed_count_private;
			break;
		case 'hater':
			public_count = props.user.hated_count_public;
			private_count = props.user.hated_count_private;
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
					onClick={() => { setSelectTab(0); }}>{(props.kind == 'follower' || props.kind == 'following') ? `追蹤 (${public_count})` : `仇視 (${public_count})`}</div>
				<div className={(!props.is_myself ? `${style.navigateTabDisable}` : (`${style.navigateTab}` + (selectTab == 1 ? ` ${style.navigateTabActive}` : '')))}
					onClick={() => { if (props.is_myself) { setSelectTab(1); } }}>{(props.kind == 'follower' || props.kind == 'following') ? `偷偷追蹤 (${private_count})` : `偷偷仇視 (${private_count})`}</div>
			</div>
			<div className={style.switchContent}>
				{selectTab == 0 && <div>
					{public_users.length == 0 ? (
						<div className={style.emptyContainer}>
							<div>{(props.kind == 'follower' || props.kind == 'following') ? '沒有公開追蹤的人' : '沒有公開仇視的人'}</div>
						</div>
					) : (
						public_users.map((user, idx) => (
							<div className={style.friendshipWrapper} key={`friendship-${idx}`}>
								<UserCard user={user} />
							</div>
						))
					)}
				</div>}
				{selectTab == 1 && <div>
					{private_users.length == 0 ? (
						<div className={style.emptyContainer}>
							<div>{(props.kind == 'follower' || props.kind == 'following') ? '沒有偷偷追蹤的人' : '沒有偷偷仇視的人'}</div>
						</div>
					) : (
						private_users.map((user, idx) => (
							<div className={style.friendshipWrapper} key={`friendship-${idx}`}>
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
			kind_text = `追蹤 ${props.user.user_name} 的人`;
			break;
		case 'hater':
			kind_text = `仇視 ${props.user.user_name} 的人`;
			break;
		case 'following':
			kind_text = `${props.user.user_name} 追蹤的人`;
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

function Profile(props: { profile_user: User, setProfileUser: Function, user_state: UserStateType }): JSX.Element {
	const [relation_type, setRelationType] = React.useState<UserRelationKind>(UserRelationKind.None);
	const [relation_public, setRelationPublic] = React.useState<boolean>(false);
	const [visible_follower, setVisibleFollower] = React.useState<boolean>(false);
	const [visible_hater, setVisibleHater] = React.useState<boolean>(false);
	const [visible_following, setVisibleFollowing] = React.useState<boolean>(false);
	const [visible_hating, setVisibleHating] = React.useState<boolean>(false);
	const { addRoom } = BottomPanelState.useContainer();
	const { addDirectChat } = AllChatState.useContainer();

	function setSentence(sentence: string): void {
		let new_state = produce(props.profile_user, nxt => {
			if (nxt != null) {
				nxt.sentence = sentence;
			}
		});
		props.setProfileUser(new_state);
	}

	async function createUserRelation(kind: UserRelationKind, is_public: boolean): Promise<{}> {
		if (props.profile_user) {
			try {
				console.log('is_public');
				console.log(is_public);
				await API_FETCHER.userQuery.createUserRelation(props.profile_user.id, kind, is_public);
			} catch (err) {
				toastErr(err);
			}
		}
		return {};
	}

	async function deleteUserRelation(): Promise<{}> {
		if (props.profile_user) {
			try {
				await API_FETCHER.userQuery.deleteUserRelation(props.profile_user.id);
			} catch (err) {
				toastErr(err);
			}
		}
		return {};
	}

	function onChangeRelation(kind: UserRelationKind, is_public: boolean): void {
		// if same as the old relation, we just remove it
		// otherwise, change it to new relation
		if (relation_type === kind && relation_public === is_public) {
			deleteUserRelation();
			setRelationType(UserRelationKind.None);
			setRelationPublic(false);
		} else {
			createUserRelation(kind, is_public);
			setRelationType(kind);
			setRelationPublic(is_public);
		}
	}

	function onStartChat(): void {
		const user_name = props.profile_user.user_name;
		addDirectChat(user_name, new DirectChatData(user_name, 0, props.profile_user.id, [], new Date(), false));
		addRoom(user_name);
	}

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
		setVisibleFollower(false);
		setVisibleHater(false);
		setVisibleFollowing(false);
		setVisibleHating(false);
	}, [props.profile_user, props.user_state.login]);

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;

	return <div className={style.up}>
		<div className={style.avatarContainer}>
			<Avatar is_me={is_me} name={props.profile_user.user_name} />
		</div>
		<div className={style.abstract}>
			<div className={style.username}>{props.profile_user.user_name}</div>
			<Sentence is_me={is_me} sentence={props.profile_user.sentence} setSentence={setSentence} />
			<div className={style.data}>
				<div className={style.energy}>{props.profile_user.energy} 鍵能</div>
				<div className={style.trace}>
					<div onClick={() => setVisibleFollower(true)}>❤️ 被 {props.profile_user.followed_count_public + props.profile_user.followed_count_private} 人追蹤</div>
					<div onClick={() => setVisibleFollowing(true)}>❤️ 追蹤 {props.profile_user.following_count_public + props.profile_user.following_count_private} 人</div>
				</div>
				<div className={style.hate}>
					<div onClick={() => setVisibleHater(true)}>⚔ 被 {props.profile_user.hated_count_public + props.profile_user.hated_count_private} 人仇視</div>
					<div onClick={() => setVisibleHating(true)}>⚔ 仇視 {props.profile_user.hating_count_public + props.profile_user.hating_count_private} 人</div>
				</div>
			</div>
		</div>
		<div className={style.operation}>
			<div className={style.links}>
				{
					// TODO 支援 private Follow, Hate
					props.user_state.login && props.user_state.user_name != props.profile_user.user_name ?
						<div className={style.relation}>
							<button onClick={() => onChangeRelation(UserRelationKind.Follow, true)}>
								{relation_type == UserRelationKind.Follow && relation_public ? '取消公開追蹤' : '公開追蹤'}
							</button>
							<button onClick={() => onChangeRelation(UserRelationKind.Follow, false)}>
								{relation_type == UserRelationKind.Follow && !relation_public ? '取消私下追蹤' : '私下追蹤'}
							</button>
							<button onClick={() => onChangeRelation(UserRelationKind.Hate, true)}>
								{relation_type == UserRelationKind.Hate && relation_public ? '取消公開仇視' : '公開仇視'}
							</button>
							<button onClick={() => onChangeRelation(UserRelationKind.Hate, false)}>
								{relation_type == UserRelationKind.Hate && !relation_public ? '取消私下仇視' : '私下仇視'}
							</button>
						</div> :
						<></>
				}
				<a href={`/app/user_board/${props.profile_user.user_name}`}>個板</a>
				{
					is_me ?
						<></> :
						<a onClick={onStartChat}>私訊</a>
				}
			</div>
		</div>
		<RelationModal user={props.profile_user} kind="follower"  is_myself={false} visible={visible_follower} setVisible={setVisibleFollower} />
		<RelationModal user={props.profile_user} kind="hater"     is_myself={false} visible={visible_hater} setVisible={setVisibleHater} />
		<RelationModal user={props.profile_user} kind="following" is_myself={is_me} visible={visible_following} setVisible={setVisibleFollowing} />
		<RelationModal user={props.profile_user} kind="hating"    is_myself={is_me} visible={visible_hating} setVisible={setVisibleHating} />
	</div>;
}

function ProfileWorks(props: { profile_user: User, user_state: UserStateType }): JSX.Element {
	const [selectTab, setSelectTab] = React.useState<number>(0);
	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);

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
			<div className={style.navigateTab + (selectTab == 1 ? ` ${style.navigateTabActive}` : '')} onClick={() => { handleSelectTab(1); }}>衛星文章</div>
			<div className={style.navigateTab + (selectTab == 2 ? ` ${style.navigateTabActive}` : '')} onClick={() => { handleSelectTab(2); }}>收藏</div>
		</div>
		<div className={style.switchContent}>
			{selectTab == 0 && <Articles articles={articles} />}
			{selectTab == 1 && <Satellites />}
			{selectTab == 2 && <Favorites profile_user={props.profile_user} />}
		</div>
	</div>;
}

function Articles(props: { articles: ArticleMeta[] }): JSX.Element {
	return <div>
		{props.articles.map((article, idx) => (
			<div className={articleWrapper} key={`article-${idx}`}>
				<ArticleCard article={article} />
			</div>
		))}
	</div>;
}

function Favorites(props: { profile_user: User }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [favorites, setFavorites] = React.useState<Favorite[]>([]);

	React.useEffect(() => {
		// TODO change fetchFavorites to get a user_id as parameter
		Promise.all([
			fetchFavorites(),
		]).then(([more_favorites]) => {
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

	let sortedFavorites = Array.from(favorites).sort((lhs, rhs) => {
		return lhs.create_time < rhs.create_time ? 1 : -1;
	});
	return <div>
		{sortedFavorites.map((favorite, idx) => (
			<div className={favoriteWrapper} key={`article-${idx}`}>
				<div className={favoriteTitle}>{relativeDate(new Date(favorite.create_time))}</div>
				<div className={articleWrapper} >
					<ArticleCard article={favorite.meta} />
				</div>
			</div>
		))}
	</div>;
}

function Satellites(): JSX.Element {
	return <div>衛星文章</div>;
}

async function fetchArticles(
	author_name: string,
): Promise<ArticleMeta[]> {
	return unwrap_or(await API_FETCHER.articleQuery.searchArticle(author_name, null, null, null, null, null, new Map()), []);
}

async function fetchFavorites(): Promise<Favorite[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryMyFavoriteArticleList(), []);
}

async function fetchFollowers(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryFollowerList(user_id), []);
}

async function fetchHaters(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.userQuery.queryHaterList(user_id), []);
}

async function fetchFollowings(user_id: number, is_public: boolean, is_myself: boolean): Promise<UserMini[]> {
	if (!is_public && !is_myself) {
		return [];
	}
	return unwrap_or(await API_FETCHER.userQuery.queryFollowingList(user_id, is_public), []);
}

async function fetchHatings(user_id: number, is_public: boolean, is_myself: boolean): Promise<UserMini[]> {
	if (!is_public && !is_myself) {
		return [];
	}
	return unwrap_or(await API_FETCHER.userQuery.queryHatingList(user_id, is_public), []);
}

type Props = RouteComponentProps<{ profile_name: string }>;

function UserPage(props: Props): JSX.Element {
	const profile_name = props.match.params.profile_name;
	const { user_state } = UserState.useContainer();

	const [user, setUser] = React.useState<User | null>(null);

	React.useEffect(() => {
		Promise.all([
			API_FETCHER.userQuery.queryUser(profile_name)
		]).then(([user]) => {
			try {
				setUser(unwrap(user));
			} catch (err) {
				toastErr(err);
			}
		});
	}, [profile_name]);

	if (!user) {
		return <></>;
	}
	return <div>
		<Profile profile_user={user} setProfileUser={setUser} user_state={user_state} />
		<div className={style.down}>
			<ProfileWorks profile_user={user} user_state={user_state} />
			<ProfileDetail profile_user={user} user_state={user_state} />
		</div>
	</div>;
}

export {
	UserPage
};