import * as React from 'react';
import style from '../../css/board_switch/article_card.module.css';
import '../../css/global.css';
import { dateDistance, relativeDate } from '../../ts/date';
import { Link } from 'react-router-dom';
import { Article, ArticleMeta, Author, Edge, MiniBondArticleMeta } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import { ArticleContent } from '../board_switch/article_page';
import { ReplyModal, SatelliteModal } from './modal';

const MAX_BRIEF_LINE = 4;

function ShowAuthor(props: {author: Author}): JSX.Element {
	if (props.author == 'Anonymous') {
		return <div className={`${style.authorId} ${style.anonymous}`}>匿名用戶</div>;
	} else if (props.author == 'MyAnonymous') {
		return <div className={`${style.authorId} ${style.anonymous}`}>匿名用戶（我自己）</div>;
	} else {
		return <Link to={`/app/user/${props.author.NamedAuthor.name}`}>
			<div className={style.authorId}>{props.author.NamedAuthor.name}</div>
		</Link>;
	}
}

export function ArticleHeader(props: { author: Author, board_name: string, date: Date }): JSX.Element {
	const date_string = relativeDate(props.date);
	return <div className={style.articleHeader}>
		<ShowAuthor author={props.author} />
		發佈於
		<Link to={`/app/b/${props.board_name}`}>
			<div className={style.articleBoard}>{props.board_name}</div>
		</Link>
		<div className={style.seperationDot}>•</div>
		<div className={style.articleTime}>{date_string}</div>
	</div>;
}

export function ArticleLine(props: { category: string, title: string, id: number, board_name: string }): JSX.Element {

	return <div className={style.articleLine}>
		<span className={`${style.articleCategory} ${style.border}`}>{props.category}</span>
		<a href={`/app/b/${props.board_name}/a/${props.id}`} target="_blank" className="styleless">
			<span className={style.articleTitle}>{props.title}</span>
		</a>
		<Link className={style.articleGraphViewIcon} to={`/app/b/${props.board_name}/graph/${props.id}`}><span> 🗺</span></Link>
	</div>;
}

enum ModalType {
	Reply,
	Satellite,
	None
}

export function ArticleFooter(props: { article: ArticleMeta }): JSX.Element {
	const [favorite, setFavorite] = React.useState<boolean>(props.article.personal_meta.is_favorite);
	const [tracking, setTracking] = React.useState<boolean>(props.article.personal_meta.is_tracking);
	const [opening_modal, setOpeningModal] = React.useState(ModalType.None);

	async function onFavoriteArticleClick(): Promise<void> {
		if (favorite) {
			console.log('按下取消收藏');
			try {
				unwrap(await API_FETCHER.userQuery.unfavoriteArticle(props.article.id));
				setFavorite(false);
			} catch (err) {
				toastErr(err);
			}
		} else {
			console.log('按下收藏');
			try {
				unwrap(await API_FETCHER.userQuery.favoriteArticle(props.article.id));
				setFavorite(true);
			} catch (err) {
				toastErr(err);
			}
		}
	}

	async function onTrackingArticleClick(): Promise<void> {
		if (tracking) {
			console.log('按下取消追蹤');
			try {
				unwrap(await API_FETCHER.userQuery.untrackingArticle(props.article.id));
				setTracking(false);
			} catch (err) {
				toastErr(err);
			}
		} else {
			console.log('按下追蹤');
			try {
				unwrap(await API_FETCHER.userQuery.trackingArticle(props.article.id));
				setTracking(true);
			} catch (err) {
				toastErr(err);
			}
		}
	}

	function openModal(ty: ModalType): void {
		setOpeningModal(ty);
	}
	function closeModal(): void {
		setOpeningModal(ModalType.None);
	}

	return <div className={style.articleFooter}>
		<div className={style.articleBtns}>
			<div className={style.articleBtnItem}>
				☘️&nbsp;<span className={style.num}>{props.article.energy}</span>鍵能
			</div>
			<div className={style.articleBtnItem} onClick={() => openModal(ModalType.Satellite)}>
				🗯️&nbsp;<span className={style.num}>{props.article.stat.satellite_replies}</span>則衛星
			</div>
			<div className={style.articleBtnItem} onClick={() => openModal(ModalType.Reply)}>
				➡️&nbsp;<span className={style.num}>{props.article.stat.replies}</span>篇回文
			</div>
			<div className={style.articleBtnItem} onClick={() => onTrackingArticleClick()}>
				{tracking ? '👣 取消追蹤' : <span><span className={style.articleBtnItemTracking}>👣</span> 追蹤</span>}
			</div>
			<div className={style.articleBtnItem} onClick={() => onFavoriteArticleClick()}>
				{favorite ? '🌟 取消收藏' : <span><span className={style.articleBtnItemTracking}>🌟</span> 收藏</span>}
			</div>
			<div className={style.articleBtnItem}>
				📎 分享
			</div>
		</div>
		{
			(() => {
				switch (opening_modal) {
					case ModalType.Reply: {
						return <ReplyModal article={props.article} close={closeModal}/>;
					}
					case ModalType.Satellite: {
						return <SatelliteModal article={props.article} close={closeModal}/>;
					}
					default: {
						return null;
					}
				}
			})()
		}
	</div>;
}

function BondLine(props: { mini_meta: MiniBondArticleMeta, board_name: string }): JSX.Element {
	return <div className={style.bondLine}>
		<Link className={style.leftSet} to={`/app/b/${props.board_name}/a/${props.mini_meta.article_id}`}>
			<span className={style.bondTag}>{props.mini_meta.bond_tag}</span>
			<span className={style.border}>{props.mini_meta.category}</span>
			<span>{props.mini_meta.title}</span>
		</Link>
		<div className={style.rightSet}>
			<span>{dateDistance(new Date(props.mini_meta.create_time))}</span>
			<span> • </span>
			<Link className={style.authorName} to={`/app/user/${props.mini_meta.author_name}`}>{props.mini_meta.author_name}</Link>
		</div>
	</div>;
}

function ArticleCard(props: { article: ArticleMeta, bonds: Array<MiniBondArticleMeta> }): JSX.Element {
	const date = new Date(props.article.create_time);

	const author = props.article.author;
	const category = props.article.category;

	return (
		<div>
			{
				props.bonds.map(bond => <BondLine mini_meta={bond} board_name={props.article.board_name} key={bond.article_id}/>)
			}
			<div className={style.articleContainer}>
				<ArticleHeader author={author} board_name={props.article.board_name} date={date} />
				<div className={style.articleBody}>
					<div className={style.leftPart}>
						<ArticleLine
							board_name={props.article.board_name}
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
	let energy_icon = '👊';
	if (props.bond.energy > 0) {
		energy_icon = '👍';
	} else if (props.bond.energy < 0) {
		energy_icon = '👎';
	}
	return <div>
		<div className={style.upperSet}>
			<span>{props.bond.tag}</span> <span>{energy_icon}</span>
		</div>
		<div className={style.lowerSet}>
			<span>{props.bond.name}</span>
		</div>
	</div>;
}

function SimpleArticleCard(props: { meta: ArticleMeta, bond?: Edge }): JSX.Element {
	const { meta } = props;
	const url = `/app/b/${meta.board_name}/a/${meta.id}`;
	return <div className={style.simpleArticleCard}>
		<div key={meta.title} className={style.leftSet}>
			<ArticleLine
				board_name={meta.board_name}
				title={meta.title}
				id={meta.id}
				category={meta.category} />
			<ArticleHeader
				author={meta.author}
				board_name={meta.board_name}
				date={new Date(meta.create_time)} />
		</div>
		{
			props.bond ?
				<div className={style.rightSet}>
					<BondCard bond={props.bond}/>
				</div>
				: <></>
		}
		<Link className={style.overlay} to={url} target="_blank"></Link >
		{/* TODO: 有沒有可能讓上一行不要開新分頁？ */}
	</div>;
}

function SimpleArticleCardById(props: { article_id: number }): JSX.Element {
	let [meta, setMeta] = React.useState<ArticleMeta | null>(null);

	React.useEffect(() => {
		API_FETCHER.articleQuery.queryArticleMeta(props.article_id).then(data => {
			setMeta(unwrap(data));
			// setFetching(false);
		}).catch(err => {
			toastErr(err);
			// setFetching(false);
		});
	}, [props.article_id]);

	// TODO: 改為 fetching 圖標
	if (meta == null) {
		return <></>;
	} else {
		return <SimpleArticleCard meta={meta} />;
	}
}

function SatelliteCard(props: { meta: ArticleMeta, bond: Edge }): JSX.Element {
	const date_string = relativeDate(new Date(props.meta.create_time));
	return <div className={style.satelliteCard}>
		<BondCard bond={props.bond} />
		<div className={style.satelliteHeader}>
			<ShowAuthor author={props.meta.author} />
			<div className={style.articleTime}>{date_string} {props.meta.category}</div>
		</div>
		<div>
			{props.meta.title}
		</div>
	</div>;
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
			let lines = Math.floor(height / line_height);
			if (lines > MAX_BRIEF_LINE) {
				setShrinkable(true);
				setReady(true);
				wrapper.style.height = `${line_height * MAX_BRIEF_LINE}px`;
			} else if (!truncated) {
				console.log(`${props.article.id}摘要完整且行數短，直接展開`);
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
		return <>
			<br />
			{
				article == null ?
					<a onClick={() => expand()}>...閱讀更多</a> :
					shrinkable ? <a onClick={() => setArticle(null)}>收起</a> : null
			}
		</>;
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
	SatelliteCard,
	BondCard,
};