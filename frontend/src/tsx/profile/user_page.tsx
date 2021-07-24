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

import {articleWrapper} from '../../css/article_wrapper.module.css';
import {favoriteTitle, favoriteWrapper} from '../../css/favorite_wrapper.module.css';
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
			await API_FETCHER.updateSentence(input_props.value);
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
			await API_FETCHER.updateInformation(introduction, gender, job, city);
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

function Profile(props: { profile_user: User, setProfileUser: Function, user_state: UserStateType }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [relation, setRelation] = React.useState<UserRelationKind>(UserRelationKind.None);

	function setSentence(sentence: string): void {
		let new_state = produce(props.profile_user, nxt => {
			if (nxt != null) {
				nxt.sentence = sentence;
			}
		});
		props.setProfileUser(new_state);
	}

	async function createUserRelation(kind: UserRelationKind): Promise<{}> {
		if (props.profile_user) {
			try {
				await API_FETCHER.createUserRelation(props.profile_user.id, kind);
			} catch (err) {
				toastErr(err);
			}
		}
		return {};
	}

	async function deleteUserRelation(): Promise<{}> {
		if (props.profile_user) {
			try {
				await API_FETCHER.deleteUserRelation(props.profile_user.id);
			} catch (err) {
				toastErr(err);
			}
		}
		return {};
	}

	function onChangeRelation(kind: UserRelationKind): void {
		switch (kind) {
			case UserRelationKind.Follow:
				break;
			case UserRelationKind.OpenlyFollow:
				if (relation == UserRelationKind.OpenlyFollow) {
					deleteUserRelation();
					setRelation(UserRelationKind.None);
				} else {
					createUserRelation(UserRelationKind.OpenlyFollow);
					setRelation(UserRelationKind.OpenlyFollow);
				}
				break;
			case UserRelationKind.Hate:
				break;
			case UserRelationKind.OpenlyHate:
				if (relation == UserRelationKind.OpenlyHate) {
					deleteUserRelation();
					setRelation(UserRelationKind.None);
				} else {
					createUserRelation(UserRelationKind.OpenlyHate);
					setRelation(UserRelationKind.OpenlyHate);
				}
				break;
			default:
				break;
		}
	}

	React.useEffect(() => {
		async function queryUserRelation(): Promise<{}> {
			if (props.profile_user) {
				try {
					await API_FETCHER.queryUserRelation(props.profile_user.id).then((res) => {
						setRelation(unwrap(res));
					});
				} catch (err) {
					toastErr(err);
				}
			}
			return {};
		}
		if (props.profile_user && user_state.login) {
			queryUserRelation();
		}
	}, [props.profile_user, user_state.login]);

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
					<p>被 {props.profile_user.followed_count} 人追蹤</p>
					<p>追蹤 {props.profile_user.following_count} 人</p>
				</div>
				<div className={style.hate}>
					<p>被 {props.profile_user.hated_count} 人仇視</p>
					<p>仇視 {props.profile_user.hating_count} 人</p>
				</div>
			</div>
		</div>
		<div className={style.operation}>
			<div className={style.links}>
				{
					// TODO 支援 private Follow, Hate
					props.user_state.login && props.user_state.user_name != props.profile_user.user_name ?
						<div className={style.relation}>
							<button onClick={() => onChangeRelation(UserRelationKind.OpenlyFollow)}>
								{relation == UserRelationKind.Follow || relation == UserRelationKind.OpenlyFollow ? '取消追蹤' : '追蹤'}
							</button>
							<button onClick={() => onChangeRelation(UserRelationKind.OpenlyHate)}>
								{relation == UserRelationKind.Hate || relation == UserRelationKind.OpenlyHate ? '取消仇視' : '仇視'}
							</button>
						</div> :
						<></>
				}
				<a href={`/app/user_board/${props.profile_user.user_name}`}>個板</a>
				<a>私訊</a>
			</div>
		</div>
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
			<div className={'navigateTab' + (selectTab == 0 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(0); }}>文章</div>
			<div className={'navigateTab' + (selectTab == 1 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(1); }}>衛星文章</div>
			<div className={'navigateTab' + (selectTab == 2 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(2); }}>收藏</div>
			<div className={'navigateTab' + (selectTab == 3 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(3); }}>人際關係</div>
		</div>
		<div className={style.switchContent}>
			{selectTab == 0 && <Articles articles={articles} />}
			{selectTab == 1 && <Satellites />}
			{selectTab == 2 && <Favorites profile_user={props.profile_user} />}
			{selectTab == 3 && <Friendships user={props.profile_user} />}
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

function Friendships(props: { user: User }): JSX.Element {
	const [followers, setFollowers] = React.useState<UserMini[]>([]);
	const [haters, setHaters] = React.useState<UserMini[]>([]);

	React.useEffect(() => {
		Promise.all([
			fetchFollowers(props.user.id),
			fetchHaters(props.user.id),
		]).then(([more_followers, more_haters]) => {
			try {
				setFollowers(more_followers);
				setHaters(more_haters);
			} catch (err) {
				toastErr(err);
			}
		});
	}, [props.user]);

	return <div className={style.userListContainer}>
		<div className={style.userListHeader}>💖追隨者</div>
		{followers.map((user, idx) => (
			<div className={style.friendshipWrapper} key={`friendship-follow-${idx}`}>
				<UserCard user={user} />
			</div>
		))}
		<div className={style.userListHeader}>⚔️仇視者</div>
		{haters.map((user, idx) => (
			<div className={style.friendshipWrapper} key={`friendship-hate-${idx}`}>
				<UserCard user={user} />
			</div>
		))}
	</div>;
}


async function fetchArticles(
	author_name: string,
): Promise<ArticleMeta[]> {
	return unwrap_or(await API_FETCHER.searchArticle(author_name, null, null, null, null, null, new Map()), []);
}

async function fetchFavorites(): Promise<Favorite[]> {
	return unwrap_or(await API_FETCHER.queryMyFavoriteArticleList(), []);
}

async function fetchFollowers(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.queryFollowerList(user_id), []);
}

async function fetchHaters(user_id: number): Promise<UserMini[]> {
	return unwrap_or(await API_FETCHER.queryHaterList(user_id), []);
}

type Props = RouteComponentProps<{ profile_name: string }>;

function UserPage(props: Props): JSX.Element {
	const profile_name = props.match.params.profile_name;
	const { user_state } = UserState.useContainer();

	const [user, setUser] = React.useState<User | null>(null);

	React.useEffect(() => {
		Promise.all([
			API_FETCHER.queryUser(profile_name)
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