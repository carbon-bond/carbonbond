import * as React from 'react';
import style from '../../css/board/article_card.module.css';
import '../../css/global.css';
import { relativeDate } from '../../ts/date';
import { Link } from 'react-router-dom';
import { Article, Comment, ArticleMeta, Author, Edge, BondInfo, MiniArticleMeta, BoardType, Attitude } from 'carbonbond-api/api_trait';
import { API_FETCHER, unwrap } from 'carbonbond-api/api_utils';
import { toastErr, useInputValue } from '../utils';
import { ArticleContent } from '../board/article_page';
import { ShowText } from '../display/show_text';
import { BonderCards } from './bonder';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../../ts/utils';
import { getBoardInfo } from '../board';
import { UserState } from '../global_state/user';
import { EditorPanelState } from '../global_state/editor_panel';

const MAX_BRIEF_LINE = 4;

function ShowAuthor(props: {author: Author}): JSX.Element {
	if (props.author == 'Anonymous') {
		return <span className={`${style.authorId} ${style.anonymous}`}>匿名</span>;
	} else if (props.author == 'MyAnonymous') {
		return <span className={`${style.authorId} ${style.anonymous}`}>匿名（我）</span>;
	} else {
		return <Link to={`/app/user/${props.author.NamedAuthor.name}`}>
			<span className={style.authorId}>{props.author.NamedAuthor.name}</span>
		</Link>;
	}
}

function EditArticle(props: {author: Author, article_meta: ArticleMeta}): JSX.Element {
	const { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel, setEditorPanelData } = EditorPanelState.useContainer();
	if (props.author == 'MyAnonymous' || (props.author != 'Anonymous' && user_state.login && user_state.id == props.author.NamedAuthor.id)) {
		// NOTE: 爲了讓 TypeScript 排除掉 'Anonymous'，才增加 != 'Anonymous' 的判斷
		// 若升級 TypeScript 後無需手動提示，可簡化以上判斷式
		return <div className={style.edit}
			onClick={() => {
				if (editor_panel_data) {
					toastErr('尚在編輯其他文章，請關閉當前編輯器後再重新點擊');
					return;
				}
				Promise.all([
					API_FETCHER.boardQuery.queryBoardById(props.article_meta.board_id),
					API_FETCHER.articleQuery.queryArticle(props.article_meta.id)
				])
				.then(data => {
					const board = unwrap(data[0]);
					const article = unwrap(data[1]);
					return {board, article};
				})
				.then(({board, article}) => {
					setEditorPanelData({
						id: article.meta.id,
						board: board,
						anonymous: article.meta.author == 'MyAnonymous',
						title: article.meta.title,
						category_name: article.meta.category,
						value: {
							content: JSON.parse(article.content),
							fields: article.meta.fields,
						},
						bonds: article.bonds
					});
					openEditorPanel();
				})
				.catch(err => console.error(err));
			}} >
			✏️編輯
		</div>;
	} else {
		return <></>;
	}
}

export function ArticleHeader(props: {
	author: Author,
	board_info: { board_name: string, board_type: BoardType },
	date: Date,
	article_meta: ArticleMeta,
	with_button: boolean,
}): JSX.Element {
	const date_string = relativeDate(props.date);
	const board_info = getBoardInfo(props.board_info);
	return <div className={style.articleHeader}>
		<div className={style.basicInfo}>
			<ShowAuthor author={props.author} />
			發佈於
			<Link to={board_info.to_url()}>
				<div className={style.articleBoard}>{props.board_info.board_name}</div>
			</Link>
			<div className={style.seperationDot}>•</div>
			<div className={style.articleTime}>{date_string}</div>
		</div>
		{
			props.with_button ?
				<EditArticle author={props.author} article_meta={props.article_meta} /> :
				<></>
		}
	</div>;
}

export function ArticleLine(props: { category: string, title: string, id: number, board_info: {board_name: string, board_type: BoardType} }): JSX.Element {
	let board_info = getBoardInfo(props.board_info);
	return <div className={style.articleLine}>
		<span className={`${style.articleCategory} ${style.border}`}>{props.category}</span>
		<Link to={`${board_info.to_url()}/article/${props.id}`} className="styleless">
			<span className={style.articleTitle}>{props.title}</span>
		</Link>
		<Link className={style.articleGraphViewIcon} to={`${board_info.to_url()}/graph/${props.id}`}><span> 🗺</span></Link>
	</div>;
}

export function CommentCard(props: {comment: Comment}): JSX.Element {
	return <div>
		<div className={style.commentHeader}>
			<ShowAuthor author={props.comment.author} />
			<span>{relativeDate(new Date(props.comment.create_time))}</span>
		</div>
		<div className={style.commentContent}>
			<ShowText text={props.comment.content} />
		</div>
	</div>;
}

export function CommentCards(props: { article_id: number }): JSX.Element {
	let [comments, setComments] = React.useState<Comment[]>([]);
	let [anonymous, setAnonymous] = React.useState<boolean>(false);
	const { input_props, setValue } = useInputValue('');
	function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
		// 使用 mac 上的注音輸入法，在 safari 上按 enter 選字時
		// e.key == 'Enter' ，使得選字事件與純按 enter 事件無法區分
		// 但使用將要廢棄的 e.keyCode 反而能夠分辨，選字時 e.keyCode == 229
		// 純按 enter 時， e.keyCode == 13
		if (e.keyCode == 13 && !e.shiftKey && input_props.value.length > 0) {
			API_FETCHER.articleQuery.createComment(props.article_id, input_props.value, anonymous).then(_id => {
				return API_FETCHER.articleQuery.queryCommentList(props.article_id);
			}).then(data => {
				setComments(unwrap(data));
			}).catch(err => {
				toastErr(err);
			});
			setValue('');
			e.preventDefault();
		}
	}
	React.useEffect(() => {
		API_FETCHER.articleQuery.queryCommentList(props.article_id).then(data => {
			setComments(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [props.article_id]);

	return <div className={style.commentCards}>
		{
			comments.map((comment) => {
				return <CommentCard comment={comment} key={comment.id} />;
			})
		}
		<label>
			<input type="checkbox"
				checked={anonymous}
				onChange={(evt) => setAnonymous(evt.target.checked)} />
			匿名
		</label>
		<textarea {...input_props} onKeyDown={onKeyDown} placeholder="我來留言" />
	</div>;
}

export enum Hit {
	Comment, Reply, None
};

export function ArticleFooter(props: { article: ArticleMeta, hit?: Hit }): JSX.Element {
	const [favorite, setFavorite] = React.useState<boolean>(props.article.personal_meta.is_favorite);
	const [tracking, setTracking] = React.useState<boolean>(props.article.personal_meta.is_tracking);
	const [hit, setHit] = React.useState<Hit>(props.hit ?? Hit.None);
	const [attitude, setAttitude] = React.useState<Attitude>(props.article.personal_meta.attitude);
	const [good_count, setGoodCount] = React.useState<number>(props.article.good);
	const [bad_count, setBadCount] = React.useState<number>(props.article.bad);
	const board_info = getBoardInfo(props.article);

	React.useEffect(() => {
		setFavorite(props.article.personal_meta.is_favorite);
		setTracking(props.article.personal_meta.is_tracking);
		setAttitude(props.article.personal_meta.attitude);
		setGoodCount(props.article.good);
		setBadCount(props.article.bad);
	}, [props.article]);


	async function onFavoriteArticleClick(): Promise<void> {
		try {
			if (favorite) {
				unwrap(await API_FETCHER.userQuery.unfavoriteArticle(props.article.id));
				setFavorite(false);
			} else {
				unwrap(await API_FETCHER.userQuery.favoriteArticle(props.article.id));
				setFavorite(true);
			}
		} catch (err) {
			toastErr(err);
		}
	}

	async function onTrackingArticleClick(): Promise<void> {
		try {
			if (tracking) {
				unwrap(await API_FETCHER.userQuery.untrackingArticle(props.article.id));
				setTracking(false);
			} else {
				unwrap(await API_FETCHER.userQuery.trackingArticle(props.article.id));
				setTracking(true);
			}
		} catch (err) {
			toastErr(err);
		}
	}

	function onShareClick(): void {
		copyToClipboard(`${window.location.origin}${board_info.to_url()}/article/${props.article.id}`)
			.then(() => {
				toast('已複製網址到剪貼簿');
			}).catch(err => {
				toastErr(err);
			});
	}

	let tracking_button = window.is_mobile ? '👣' : '👣 取消追蹤';
	let non_tracking_button = <><span className={style.articleBtnItemTracking}>👣</span> {window.is_mobile ? '' : '追蹤'}</>;
	let favoriting_button = window.is_mobile ? '🌟' : '🌟 取消收藏';
	let non_favoriting_button = <><span className={style.articleBtnItemTracking}>🌟</span> {window.is_mobile ? '' : '收藏'}</>;

	return <div className={style.articleFooter}>
		<div className={style.articleBtns}>
			<div className={`${style.articleBtnItem} ${style.good} ${attitude == Attitude.Good ? style.chosenGood : ''}`} onClick={() => {
				let next_attitude = attitude == Attitude.Good ? Attitude.None : Attitude.Good;
				setAttitude(next_attitude);
				API_FETCHER.articleQuery.setAttitude(props.article.id, next_attitude)
				.then(data => {
					let [good, bad] = unwrap(data);
					setGoodCount(good);
					setBadCount(bad);
				})
				.catch(err => {toastErr(err);});
			}}>
				▲ 頂 <span className={style.num}>{good_count}</span>
			</div>
			<div className={`${style.articleBtnItem} ${style.bad} ${attitude == Attitude.Bad ? style.chosenBad : ''}`} onClick={() => {
				let next_attitude = attitude == Attitude.Bad ? Attitude.None : Attitude.Bad;
				setAttitude(next_attitude);
				API_FETCHER.articleQuery.setAttitude(props.article.id, next_attitude)
				.then(data => {
					let [good, bad] = unwrap(data);
					setGoodCount(good);
					setBadCount(bad);
				})
				.catch(err => {toastErr(err);});
			}}>
				▼ 踩 <span className={style.num}>{bad_count}</span>
			</div>
			<div className={`${style.articleBtnItem} ${hit == Hit.Comment ? style.hit : ''}`} onClick={() => {
				if (hit == Hit.Comment) {
					setHit(Hit.None);
				} else {
					setHit(Hit.Comment);
				}
			}}>
				🗯️ 留言 <span className={style.num}>{props.article.stat.comments}</span>
			</div>
			<div className={`${style.articleBtnItem} ${hit == Hit.Reply ? style.hit : ''}`} onClick={() => {
				if (hit == Hit.Reply) {
					setHit(Hit.None);
				} else {
					setHit(Hit.Reply);
				}
			}}>
				➡️ 回文 <span className={style.num}>{props.article.stat.replies}</span>
			</div>
			<div className={style.articleBtnItem} onClick={onTrackingArticleClick}>
				{tracking ? tracking_button : non_tracking_button}
			</div>
			<div className={style.articleBtnItem} onClick={onFavoriteArticleClick}>
				{favorite ? favoriting_button: non_favoriting_button}
			</div>
			<div className={style.articleBtnItem} onClick={onShareClick}>
				{`📎${window.is_mobile ? '' : ' 分享'}`}
			</div>
		</div>
		{
			(() => {
				switch (hit) {
					case Hit.Comment:
						return <div className={style.replies}>
							<CommentCards article_id={props.article.id} />
						</div>;
					case Hit.Reply:
						return <div className={style.replies}>
							<BonderCards article_id={props.article.id} />
						</div>;
					case Hit.None:
						return <></>;
				}
			})()
		}
	</div>;
}

export function BondLine(props: { mini_meta: MiniArticleMeta, children: React.ReactNode }): JSX.Element {
	const board_info = getBoardInfo(props.mini_meta);
	return <div className={style.bondLine}>
		{props.children}
		<Link to={`${board_info.to_url()}/article/${props.mini_meta.id}`}>
			<span className={style.border}>{props.mini_meta.category}</span>
			<span>{props.mini_meta.title}</span>
		</Link>
	</div>;
}

export function NormalBondLines(props: { bonds: Array<BondInfo> }): JSX.Element {
	return <>
		{
			props.bonds.map(bond => {
				return <BondLine
					mini_meta={bond.article_meta}
					key={`${bond.article_meta.id}#${bond.tag}`}>
		➥
					<span className={style.bondTag}>{bond.tag}</span>
				</BondLine>;
			})
		}
	</>;
}

function ArticleCard(props: { article: ArticleMeta, bonds: Array<BondInfo> }): JSX.Element {
	const date = new Date(props.article.create_time);

	const author = props.article.author;
	const category = props.article.category;

	return (
		<div>
			<div className={style.articleContainer}>
				<ArticleHeader author={author} board_info={props.article} date={date} article_meta={props.article} with_button={true} />
				<div className={style.articleBody}>
					<div className={style.leftPart}>
						<div className={style.articleLineWrap}>
							<ArticleLine
								board_info={props.article}
								category={category}
								title={props.article.title}
								id={props.article.id} />
							<NormalBondLines bonds={props.bonds} />
						</div>
						<ArticleContentShrinkable article={props.article}/>
					</div>
				</div>
				<ArticleFooter article={props.article} />
			</div>
		</div>
	);
}

function BondCard(props: { bond: Edge }): JSX.Element {
	let energy_icon = '';
	if (props.bond.energy > 0) {
		energy_icon = '+1';
	} else if (props.bond.energy < 0) {
		energy_icon = '-1';
	}
	return <div>
		<span>{props.bond.tag}</span> <span>{energy_icon}</span>
	</div>;
}

function SimpleArticleCard(props: { children?: React.ReactNode, meta: ArticleMeta }): JSX.Element {
	const { meta } = props;
	const board_info = getBoardInfo(props.meta);
	const url = `${board_info.to_url()}/article/${meta.id}`;
	return <div className={style.simpleArticleCard}>
		<div key={meta.title} className={style.leftSet}>
			<div className={style.articleLineWrap}>
				<ArticleLine
					board_info={meta}
					title={meta.title}
					id={meta.id}
					category={meta.category} />
			</div>
			<ArticleHeader
				board_info={meta}
				author={meta.author}
				article_meta={props.meta}
				date={new Date(meta.create_time)}
				with_button={false} />
		</div>
		<div className={style.rightSet}>
			{props.children}
		</div>
		<Link className={style.overlay} to={url}></Link >
	</div>;
}

function SimpleArticleCardById(props: { article_id: number }): JSX.Element {
	let [meta, setMeta] = React.useState<ArticleMeta | null>(null);

	React.useEffect(() => {
		API_FETCHER.articleQuery.queryArticleMeta(props.article_id).then(data => {
			setMeta(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [props.article_id]);

	// TODO: 改為 fetching 圖標
	if (meta == null) {
		return <></>;
	} else {
		return <SimpleArticleCard meta={meta} />;
	}
}

function ArticleContentShrinkable(props: { article: ArticleMeta }): JSX.Element {
	const [article, setArticle] = React.useState<Article | null>(null);
	const [shrinkable, setShrinkable] = React.useState(false);
	const [ready, setReady] = React.useState(false);
	let wrapper_ref = React.useRef<HTMLDivElement | null>(null);
	let content_ref = React.useRef<HTMLDivElement | null>(null);

	// eslint-disable-next-line
	let content: { [name: string]: any } = JSON.parse(props.article.digest.content);
	let truncated = props.article.digest.truncated;

	function onDivLoad(div: HTMLDivElement | null, is_wrapper: boolean): void {
		if (is_wrapper) {
			wrapper_ref.current = div;
		} else {
			content_ref.current = div;
		}
		if (content_ref.current && wrapper_ref.current) {
			let wrapper = wrapper_ref.current;
			let content_div = content_ref.current;
			let height = content_div.offsetHeight;
			let line_height =
				parseInt(window.getComputedStyle(content_div, null).getPropertyValue('line-height'));
			if (isNaN(line_height)) {
				return;
			}
			let lines = Math.floor(height / line_height);
			if (lines > MAX_BRIEF_LINE) {
				setShrinkable(true);
				setReady(true);
				wrapper.style.height = `${line_height * MAX_BRIEF_LINE}px`;
			} else if (!truncated) {
				expand();
			}
		}
	}

	function expand(): void {
		if (!truncated) {
			setArticle({
				meta: props.article,
				content: props.article.digest.content,
				bonds: []
			});
			return;
		}

		API_FETCHER.articleQuery.queryArticle(props.article.id).then(res => { // TODO: 避免重複詢問 meta?
			let article = unwrap(res);
			setArticle(article);
			setReady(true);
		}).catch(err => {
			toastErr(err);
		});
	}

	let show_name = Object.keys(content).length > 1;
	// eslint-disable-next-line
	function formatValue(value: any): string {
		if (Array.isArray(value)) {
			return value.map(v => formatValue(v)).join('\n');
		} else if (typeof value == 'string') {
			return value.trim();
		} else if (typeof value == 'number') {
			return value.toString();
		}
		return '';
	}

	function GradientFilter(): JSX.Element {
		if (article == null) {
			return <div className={style.gradientFilter} onClick={expand}></div>;
		} else {
			return <></>;
		}
	}

	if (article) {
		return <>
			<ArticleContent article={article} />
			{
				shrinkable ?
					<div className={style.readLess}>
						<a onClick={() => setArticle(null)}>收起</a>
					</div> :
					<></>
			}
		</>;
	}

	const hidden_style: React.CSSProperties = {
		opacity: 0,
		position: 'absolute',
	};
	return <>
		<div ref={div => onDivLoad(div, true)}
			style={ready ? undefined : hidden_style}
			className={style.articleContentWrapper}
		>
			<GradientFilter />
			<div ref={div => onDivLoad(div, false)}>
				{
					props.article.fields.map(field => {
						let inner = formatValue(content[field.name]);
						if (inner.length == 0) {
							return null;
						}
						return <div key={field.name}>
							{show_name ? <h4>{field.name}</h4> : null}
							<pre className={style.fieldValue}>{inner}</pre>
						</div>;
					})
				}
			</div>
		</div>
	</>;
}


export {
	ArticleCard,
	SimpleArticleCardById,
	SimpleArticleCard,
	BondCard,
};