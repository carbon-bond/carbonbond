import * as React from 'react';
import ReactModal from 'react-modal';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { RouteComponentProps } from 'react-router';
import { ArticleCard } from '../article_card';
import { Article, UserRelationKind, User } from '../../ts/api/api_trait';
import { UserState } from '../global_state/user';
import { useInputValue } from '../utils';

import '../../css/article_wrapper.css';
import '../../css/user_page.css';
import { toast } from 'react-toastify';
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
			toast.error(err);
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
			toast.error(err);
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
		return <EditSentence sentence={props.sentence} setSentence={props.setSentence}/>;
	} else if (props.sentence == '') {
		return <div styleName="noSentence">
			尚未設置一句話介紹
		</div>;
	} else {
		return <div styleName="sentence">{props.sentence}</div>;
	}
}

/*
type EditType = { type: 'radio',  name: string, options: string[] }
| { type: 'text', name: string };

function EditItem(props: EditType): JSX.Element {
	switch (props.type) {
		case 'radio': {
			return <div>
				{props.name}
				{
					props.options.map(option => {
						let id = `${props.name}-${option}`;
						return <div>
							<input type="radio" name={props.name} id={id} key={option} value={option} />
							<label htmlFor={id}>{option}</label>
						</div>;
					})
				}
			</div>;
		}
		case 'text': {
			return <div>
				{props.name}
				<input type="text" name={props.name} />
			</div>;
		}
	}
}
*/

const PAGE_SIZE: number = 10;

// TODO: 分頁
async function fetchArticles(
	author_name: string,
	page_size: number,
): Promise<Article[]> {
	return unwrap_or(await API_FETCHER.queryArticleList(author_name, null, page_size), []);
}

type Props = RouteComponentProps<{ user_name: string }>;

function UserPage(props: Props): JSX.Element {
	const user_name = props.match.params.user_name;
	const { user_state } = UserState.useContainer();

	const [articles, setArticles] = React.useState<Article[]>([]);
	const [user, setUser] = React.useState<User | null>(null);
	// TODO: 分頁
	// const [is_end, set_is_end] = React.useState<boolean>(false);

	React.useEffect(() => {
		Promise.all([
			fetchArticles(user_name, PAGE_SIZE),
			API_FETCHER.queryUser(user_name)
		]).then(([more_articles, user]) => {
			try {
				setArticles(more_articles);
				setUser(unwrap(user));
			} catch (err) {
				toast.error(err);
			}
		});
	}, [user_name]);

	function setSentence(sentence: string): void {
		let new_state = produce(user, nxt => {
			if (nxt != null) {
				nxt.sentence = sentence;
			}
		});
		setUser(new_state);
	}

	function createUserRelation(kind: UserRelationKind): void {
		if (user) {
			API_FETCHER.createUserRelation(kind, user.id);
		}
	}

	const is_me = user_state.login && user_state.user_name == user_name;

	if (!user) {
		return <></>;
	}
	return <div>
		<div styleName="up">
			<Avatar is_me={is_me} name={user_name} />
			<div styleName="abstract">
				<div styleName="username">{user_name}</div>
				<Sentence is_me={is_me} sentence={user.sentence} setSentence={setSentence}/>
				<div styleName="data">
					<div styleName="energy">{user.energy} 鍵能</div>
					<div styleName="trace">
						<p>被 {user.followed_count} 人追蹤</p>
						<p>追蹤 {user.following_count} 人</p>
					</div>
					<div styleName="hate">
						<p>被 {user.hated_count} 人仇視</p>
						<p>仇視 {user.hating_count} 人</p>
					</div>
				</div>
			</div>
			<div styleName="operation">
				<div styleName="links">
					{
						user_state.login && user_state.user_name != user_name ?
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
					<a href={`/app/user_board/${user_name}`}>個板</a>
					<a>私訊</a>
				</div>
			</div>
		</div>
		<div styleName="down">
			<div styleName="works">
				{
					articles.map((article, idx) => (
						<div styleName="articleWrapper" key={`article-${idx}`}>
							<ArticleCard article={article} />
						</div>
					))
				}
			</div>
			<div styleName="detail">
				{
					user_state.login && user_state.user_name == user_name ?
						<button styleName="editButton" onClick={() => alert('TODO')}>🖉 編輯我的資料</button> :
						<></>
				}
				<div>
					<div styleName="introduction">
						自我介紹（TODO）
					</div>
					<div styleName="info">
						性別、職業、居住城市...等（TODO）
					</div>
				</div>
			</div>
		</div>
	</div>;
}

export {
	UserPage
};