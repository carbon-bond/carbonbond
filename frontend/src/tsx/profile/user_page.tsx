import * as React from 'react';
import ReactModal from 'react-modal';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { RouteComponentProps } from 'react-router';
import { ArticleCard } from '../article_card';
import { UserRelationKind, User, ArticleMeta } from '../../ts/api/api_trait';
import { UserState, UserStateType } from '../global_state/user';
import { toastErr, useInputValue } from '../utils';
import { ModalButton, ModalWindow } from '../components/modal_window';

import '../../css/article_wrapper.css';
import '../../css/user_page.css';
import produce from 'immer';

// TODO: 可剪裁非正方形的圖片
function EditAvatar(props: { name: string }): JSX.Element {
	// const { user_state } = UserState.useContainer();
	const [is_editing, setIsEditing] = React.useState<boolean>(false);
	const [preview_data, setPreviewData] = React.useState<string | null>(null);

	function chooseAvatar(e: React.ChangeEvent<HTMLInputElement>): void {
		e.preventDefault();

		if (e.target.files == null) {
			return;
		}

		let reader = new FileReader();
		let file = e.target.files[0];
		e.target.value = '';

		reader.onloadend = () => {
			setPreviewData(reader.result as string); // 因爲使用 readAsDataURL ，故 result 爲字串
			setIsEditing(true);
		};

		reader.readAsDataURL(file);
		return;
	}

	async function uploadAvatar(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<{}> {
		e.preventDefault();
		try {
			if (preview_data != null) {
				unwrap(await API_FETCHER.updateAvatar(preview_data.split(',')[1]));
			}
			setIsEditing(false);
			location.reload();
		} catch (err) {
			toastErr(err);
		}
		return {};
	}
	return <div styleName="avatar isMine">
		<ReactModal
			isOpen={is_editing}
			onRequestClose={() => setIsEditing(false)}
			style={{
				overlay: { zIndex: 200 },
				content: {
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					right: 'none',
					bottom: 'none',
				}
			}} >
			{
				preview_data ?
					<img src={preview_data} height="144" width="144"></img> :
					<div>出了些問題......</div>
			}
			<div styleName="buttonSet">
				<button onClick={uploadAvatar}>確定</button>
				<button onClick={() => setIsEditing(false)}>取消</button>
			</div>
		</ReactModal>
		<label htmlFor="fileUploader">
			<img styleName="isMine" src={`/avatar/${props.name}`} alt={`${props.name}的大頭貼`} />
			<div styleName="editPrompt">
				換頭貼
			</div>
		</label>
		<input
			type="file"
			id="fileUploader"
			data-target="fileUploader"
			accept="image/png, image/jpeg"
			onChange={chooseAvatar} />
	</div>;
}

function Avatar(props: { is_me: boolean, name: string }): JSX.Element {
	if (props.is_me) {
		return <EditAvatar name={props.name} />;
	} else {
		return <div styleName="avatar">
			<img src={`/avatar/${props.name}`} alt={`${props.name}的大頭貼`} />
		</div>;
	}
}

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
		return <div styleName="noSentence">
			尚未設置一句話介紹
			<button onClick={() => setIsEditing(true)}>🖉 修改</button>
		</div>;
	} else {
		return <div styleName="sentence">
			{props.sentence}
			<button onClick={() => setIsEditing(true)}>🖉 修改</button>
		</div>;
	}
}

function Sentence(props: { is_me: boolean, sentence: string, setSentence: Function }): JSX.Element {
	if (props.is_me) {
		return <EditSentence sentence={props.sentence} setSentence={props.setSentence} />;
	} else if (props.sentence == '') {
		return <div styleName="noSentence">
			尚未設置一句話介紹
		</div>;
	} else {
		return <div styleName="sentence">{props.sentence}</div>;
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
			return <div styleName="editModal">
				<div styleName="label">自我介紹</div>
				<textarea placeholder="自我介紹" autoFocus value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
				<div styleName="label">性別</div>
				<div styleName="gender">
					<input type="radio" name="gender" value="男" defaultChecked={gender === '男'} onChange={(e) => setGender(e.target.value)} />
					<label>男</label>
					<input type="radio" name="gender" value="女" defaultChecked={gender === '女'} onChange={(e) => setGender(e.target.value)} />
					<label>女</label>
				</div>
				<div styleName="label">職業</div>
				<input type="text" placeholder="職業" value={job} onChange={(e) => setJob(e.target.value)} />
				<div styleName="label">居住城市</div>
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

	return <div styleName="detail">
		<div>
			<div styleName="introduction">
				<div styleName="title">自我介紹</div>
				{is_me && <button styleName="editButton" onClick={() => setEditing(true)}>🖉</button>}
			</div>
			<div styleName="info">
				<div styleName="item">{introduction}</div>
			</div>
			<div styleName="info">
				<div styleName="item">性別<span styleName="key">{gender}</span></div>
				<div styleName="item">職業為<span styleName="key">{job}</span></div>
				<div styleName="item">現居<span styleName="key">{city}</span></div>
			</div>
		</div>
		<EditModal introduction={introduction} gender={gender} job={job} city={city} />
	</div>;
}

function Profile(props: { profile_user: User, setProfileUser: Function, user_state: UserStateType }): JSX.Element {

	function setSentence(sentence: string): void {
		let new_state = produce(props.profile_user, nxt => {
			if (nxt != null) {
				nxt.sentence = sentence;
			}
		});
		props.setProfileUser(new_state);
	}

	function createUserRelation(kind: UserRelationKind): void {
		if (props.profile_user) {
			API_FETCHER.createUserRelation(props.profile_user.id, kind);
		}
	}

	const is_me = props.user_state.login && props.user_state.user_name == props.profile_user.user_name;

	return <div styleName="up">
		<Avatar is_me={is_me} name={props.profile_user.user_name} />
		<div styleName="abstract">
			<div styleName="username">{props.profile_user.user_name}</div>
			<Sentence is_me={is_me} sentence={props.profile_user.sentence} setSentence={setSentence} />
			<div styleName="data">
				<div styleName="energy">{props.profile_user.energy} 鍵能</div>
				<div styleName="trace">
					<p>被 {props.profile_user.followed_count} 人追蹤</p>
					<p>追蹤 {props.profile_user.following_count} 人</p>
				</div>
				<div styleName="hate">
					<p>被 {props.profile_user.hated_count} 人仇視</p>
					<p>仇視 {props.profile_user.hating_count} 人</p>
				</div>
			</div>
		</div>
		<div styleName="operation">
			<div styleName="links">
				{
					props.user_state.login && props.user_state.user_name != props.profile_user.user_name ?
						<div styleName="relation">
							<button onClick={() => createUserRelation(UserRelationKind.Follow)}>
								追蹤
							</button>
							<button onClick={() => createUserRelation(UserRelationKind.Hate)}>
								仇視
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
	const [favorites, setFavorites] = React.useState<ArticleMeta[]>([]);

	React.useEffect(() => {
		// TODO detect which tab is currently selected and only need to update that tab's data
		console.log('profileWorks useEffect');
		Promise.all([
			fetchArticles(props.profile_user.user_name),
		]).then(([more_articles]) => {
			console.log('profileWorks useEffect then');
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
				Promise.all([
					fetchFavorites(),
				]).then(([more_favorites]) => {
					try {
						setFavorites(more_favorites);
					} catch (err) {
						toastErr(err);
					}
				});
				break;
			case 3:
				break;
			default:
				break;
		}
		setSelectTab(tabIndex);
	}

	return <div styleName="works">
		<div styleName="navigateBar">
			<div styleName={'navigateTab' + (selectTab == 0 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(0); }}>文章</div>
			<div styleName={'navigateTab' + (selectTab == 1 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(1); }}>留言</div>
			<div styleName={'navigateTab' + (selectTab == 2 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(2); }}>收藏</div>
			<div styleName={'navigateTab' + (selectTab == 3 ? ' navigateTabActive' : '')} onClick={() => { handleSelectTab(3); }}>人際關係</div>
		</div>
		<div styleName="switchContent">
			{selectTab == 0 && <Articles articles={articles} />}
			{selectTab == 1 && <Comments />}
			{selectTab == 2 && <Articles articles={favorites} />}
			{selectTab == 3 && <Friendships />}
		</div>
	</div>;
}

function Articles(props: { articles: ArticleMeta[] }): JSX.Element {
	return <div>
		{props.articles.map((article, idx) => (
			<div styleName="articleWrapper" key={`article-${idx}`}>
				<ArticleCard article={article} />
			</div>
		))}
	</div>;
}

function Comments(): JSX.Element {
	return <div>Comments</div>;
}

function Friendships(): JSX.Element {
	return <div>Friendships</div>;
}


async function fetchArticles(
	author_name: string,
): Promise<ArticleMeta[]> {
	return unwrap_or(await API_FETCHER.searchArticle(author_name, null, null, null, null, null, new Map()), []);
}

async function fetchFavorites(): Promise<ArticleMeta[]> {
	return unwrap_or(await API_FETCHER.queryMyFavoriteArticleList(), []);
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
		<div styleName="down">
			<ProfileWorks profile_user={user} user_state={user_state} />
			<ProfileDetail profile_user={user} user_state={user_state} />
		</div>
	</div>;
}

export {
	UserPage
};