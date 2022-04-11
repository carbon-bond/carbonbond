import * as React from 'react';
import style from '../../css/board/article_card.module.css';
import '../../css/global.css';
import { dateDistance, relativeDate } from '../../ts/date';
import { Link } from 'react-router-dom';
import { Article, Comment, ArticleMeta, Author, Edge, BondInfo, MiniArticleMeta, BoardType } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr, useInputValue } from '../utils';
import { ArticleContent, ShowText } from '../board/article_page';
import { BonderCards } from './bonder';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../../ts/utils';
import { getBoardInfo } from '../board';

const MAX_BRIEF_LINE = 4;

function ShowAuthor(props: {author: Author}): JSX.Element {
	if (props.author == 'Anonymous') {
		return <span className={`${style.authorId} ${style.anonymous}`}>匿名用戶</span>;
	} else if (props.author == 'MyAnonymous') {
		return <span className={`${style.authorId} ${style.anonymous}`}>匿名用戶（我自己）</span>;
	} else {
		return <Link to={`/app/user/${props.author.NamedAuthor.name}`}>
			<span className={style.authorId}>{props.author.NamedAuthor.name}</span>
		</Link>;
	}
}

export function ArticleHeader(props: { author: Author, board_info: {board_name: string, board_type: BoardType}, date: Date }): JSX.Element {
	const date_string = relativeDate(props.date);
	const board_info = getBoardInfo(props.board_info);
	return <div className={style.articleHeader}>
		<ShowAuthor author={props.author} />
		發佈於
		<Link to={board_info.to_url()}>
			<div className={style.articleBoard}>{props.board_info.board_name}</div>
		</Link>
		<div className={style.seperationDot}>•</div>
		<div className={style.articleTime}>{date_string}</div>
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
		if (e.key == 'Enter' && !e.shiftKey && input_props.value.length > 0) {
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
	const board_info = getBoardInfo(props.article);

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

	// XXX: 個版會壞掉
	function onShareClick(): void {
		copyToClipboard(`${window.location.origin}${board_info.to_url()}/article/${props.article.id}`)
			.then(() => {
				toast('已複製網址到剪貼簿');
			}).catch(err => {
				toastErr(err);
			});
	}

	return <div className={style.articleFooter}>
		<div className={style.articleBtns}>
			<div className={style.articleBtnItem}>
				☘️ <span className={style.num}>{props.article.energy}</span>鍵能
			</div>
			<div className={`${style.articleBtnItem} ${hit == Hit.Comment ? style.hit : ''}`} onClick={() => {
				if (hit == Hit.Comment) {
					setHit(Hit.None);
				} else {
					setHit(Hit.Comment);
				}
			}}>
				🗯️ <span className={style.num}>{props.article.stat.comments}</span>則留言
			</div>
			<div className={`${style.articleBtnItem} ${hit == Hit.Reply ? style.hit : ''}`} onClick={() => {
				if (hit == Hit.Reply) {
					setHit(Hit.None);
				} else {
					setHit(Hit.Reply);
				}
			}}>
				➡️ <span className={style.num}>{props.article.stat.replies}</span>篇回文
			</div>
			<div className={style.articleBtnItem} onClick={onTrackingArticleClick}>
				{tracking ? '👣 取消追蹤' : <span><span className={style.articleBtnItemTracking}>👣</span> 追蹤</span>}
			</div>
			<div className={style.articleBtnItem} onClick={onFavoriteArticleClick}>
				{favorite ? '🌟 取消收藏' : <span><span className={style.articleBtnItemTracking}>🌟</span> 收藏</span>}
			</div>
			<div className={style.articleBtnItem} onClick={onShareClick}>
				📎 分享
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
		<div className={style.leftSet}>
			{props.children}
			<Link to={`${board_info.to_url()}/article/${props.mini_meta.id}`}>
				<span className={style.border}>{props.mini_meta.category}</span>
				<span>{props.mini_meta.title}</span>
			</Link>
		</div>
		<div className={style.rightSet}>
			<span>{dateDistance(new Date(props.mini_meta.create_time))}</span>
			<span> • </span>
			<ShowAuthor author={props.mini_meta.author} />
		</div>
	</div>;
}

function ArticleCard(props: { article: ArticleMeta, bonds: Array<BondInfo> }): JSX.Element {
	const date = new Date(props.article.create_time);

	const author = props.article.author;
	const category = props.article.category;

	return (
		<div>
			{
				props.bonds.map(bond => {
					return <BondLine
						mini_meta={bond.article_meta}
						key={`${bond.article_meta.id}#${bond.tag}`}>
						<span className={style.bondTag}>{bond.tag}</span>
					</BondLine>;
				})
			}
			<div className={style.articleContainer}>
				<ArticleHeader author={author} board_info={props.article} date={date} />
				<div className={style.articleBody}>
					<div className={style.leftPart}>
						<ArticleLine
							board_info={props.article}
							category={category}
							title={props.article.title}
							id={props.article.id} />
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
			<ArticleLine
				board_info={meta}
				title={meta.title}
				id={meta.id}
				category={meta.category} />
			<ArticleHeader
				board_info={meta}
				author={meta.author}
				date={new Date(meta.create_time)} />
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
			// console.log(props.article.id);
			// console.log(`height: ${height}`);
			// console.log(`line_height: ${line_height}`);
			// console.log(`lines: ${lines}`);
			if (lines > MAX_BRIEF_LINE) {
				setShrinkable(true);
				setReady(true);
				wrapper.style.height = `${line_height * MAX_BRIEF_LINE}px`;
			} else if (!truncated) {
				// console.log(`${props.article.id}摘要完整且行數短，直接展開`);
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

	function ShowMoreButton(): JSX.Element | null {
		return <div className={style.readMore}>
			{
				article == null ?
					<a onClick={() => expand()}>...閱讀更多</a> :
					shrinkable ? <a onClick={() => setArticle(null)}>收起</a> : null
			}
		</div>;
	}

	if (article) {
		return <>
			<ArticleContent article={article} />
			<ShowMoreButton />
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
			<div ref={div => onDivLoad(div, false)}>
				{
					props.article.fields.map(field => {
						let inner = formatValue(content[field.name]);
						if (inner.length == 0) {
							return null;
						}
						return <div key={field.name}>
							{show_name ? <h4>{field.name}</h4> : null}
							<pre className={style.articleContent}>{inner}</pre>
						</div>;
					})
				}
			</div>
		</div>
		<ShowMoreButton />
	</>;
}


export {
	ArticleCard,
	SimpleArticleCardById,
	SimpleArticleCard,
	BondCard,
};