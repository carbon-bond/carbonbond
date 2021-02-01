import * as React from 'react';
import '../../css/board_switch/article_card.css';
import { relativeDate } from '../../ts/date';
import { Link } from 'react-router-dom';
import { Article, ArticleMeta, Edge } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import { parse_category } from 'force';
import { ArticleContent } from '../board_switch/article_page';
import { ReplyModal, SatelliteModal } from './modal';

const MAX_BRIEF_LINE = 4;

export function ArticleHeader(props: { user_name: string, board_name: string, date: Date }): JSX.Element {
	const date_string = relativeDate(props.date);
	return <div styleName="articleHeader">
		<Link to={`/app/user/${props.user_name}`}>
			<div styleName="authorId">{props.user_name}</div>
		</Link>
		發佈於
		<Link to={`/app/b/${props.board_name}`}>
			<div styleName="articleBoard">{props.board_name}</div>
		</Link>
		<div styleName="seperationDot">•</div>
		<div styleName="articleTime">{date_string}</div>
	</div>;
}

export function ArticleLine(props: { category_name: string, title: string, id: number, board_name: string }): JSX.Element {

	return <div styleName="articleLine">
		<span styleName="articleType">{props.category_name}</span>
		<a href={`/app/b/${props.board_name}/a/${props.id}`} target="_blank" className="styleless">
			<span styleName="articleTitle">{props.title}</span>
		</a>
		<Link styleName="articleGraphViewIcon" to={`/app/b/${props.board_name}/graph/${props.id}`}><span> 🗺</span></Link>
	</div>;
}

enum ModalType {
	Reply,
	Satellite,
	None
}

export function ArticleFooter(props: { article: ArticleMeta }): JSX.Element {
	const [favorite, setFavorite] = React.useState<boolean>(props.article.personal_meta.is_favorite);
	const [opening_modal, setOpeningModal] = React.useState(ModalType.None);

	async function onFavoriteArticleClick(): Promise<void> {
		if (favorite) {
			console.log('按下取消收藏');
			try {
				unwrap(await API_FETCHER.unfavoriteArticle(props.article.id));
				setFavorite(false);
			} catch (err) {
				toastErr(err);
			}
		} else {
			console.log('按下收藏');
			try {
				unwrap(await API_FETCHER.favoriteArticle(props.article.id));
				setFavorite(true);
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

	return <div styleName="articleFooter">
		<div styleName="articleBtns">
			<div styleName="articleBtnItem">
				☘️&nbsp;<span styleName="num">{props.article.energy}</span>鍵能
			</div>
			<div styleName="articleBtnItem" onClick={() => openModal(ModalType.Satellite)}>
				🗯️&nbsp;<span styleName="num">{props.article.stat.satellite_replies}</span>則衛星
			</div>
			<div styleName="articleBtnItem" onClick={() => openModal(ModalType.Reply)}>
				➡️&nbsp;<span styleName="num">{props.article.stat.replies}</span>篇回文
			</div>
			<div styleName="articleBtnItem" onClick={() => onFavoriteArticleClick()}>
				{favorite ? '🌟 取消收藏' : '⭐ 收藏'}
			</div>
			<div styleName="articleBtnItem">
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

function ArticleCard(props: { article: ArticleMeta }): JSX.Element {
	const date = new Date(props.article.create_time);
	const [article, setArticle] = React.useState<Article | null>(null);
	let [need_show_more, setNeedShowMore] = React.useState(false);

	let user_name = '';
	let category_name = '';
	try {
		user_name = props.article.author_name;
		category_name = props.article.category_name;
	} catch {
		user_name = '未知';
		category_name = '未知';
	}

	const category = parse_category(props.article.category_source);
	// eslint-disable-next-line
	let content: { [name: string]: any } = JSON.parse(props.article.digest);
	function Content(): JSX.Element {
		let wrapper_ref = React.useRef<HTMLDivElement | null>(null);
		let content_ref = React.useRef<HTMLDivElement | null>(null);

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
					setNeedShowMore(true);
					wrapper.style.height = `${line_height * MAX_BRIEF_LINE}px`;
				}
			}
		}

		function expand(): void {
			API_FETCHER.queryArticle(props.article.id).then(res => { // TODO: 避免重複詢問 meta?
				let article = unwrap(res);
				setArticle(article);
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
			if (!need_show_more) {
				return null;
			}
			return <>
				<br/>
				{
					article == null ?
						<a onClick={() => expand()}>...閱讀更多</a> :
						<a onClick={() => setArticle(null)}>收起</a>
				}
			</>;
		}

		if (article) {
			return <>
				<ArticleContent article={article} />
				<ShowMoreButton />
			</>;
		}

		return <>
			<div ref={div => onDivLoad(div, true)} styleName="articleContentWrapper">
				<div ref={div => onDivLoad(div, false)}>
					{
						category.fields.map(field => {
							let inner = formatValue(content[field.name]);
							if (inner.length == 0) {
								return null;
							}
							return <div key={field.name}>
								{show_name ? <h4>{field.name}</h4> : null}
								<pre styleName="articleContent">{inner}</pre>
							</div>;
						})
					}
				</div>
			</div>
			<ShowMoreButton />
		</>;
	}

	return (
		<div styleName="articleContainer">
			<ArticleHeader user_name={user_name} board_name={props.article.board_name} date={date} />
			<div styleName="articleBody">
				<div styleName="leftPart">
					<ArticleLine
						board_name={props.article.board_name}
						category_name={category_name}
						title={props.article.title}
						id={props.article.id} />
					<Content/>
				</div>
			</div>
			<ArticleFooter article={props.article} />
		</div>
	);
}

function BondCard(props: { bond: Edge }): JSX.Element {
	let energy_icon = '😐';
	if (props.bond.energy > 0) {
		energy_icon = '😊';
	} else if (props.bond.energy < 0) {
		energy_icon = '😡';
	}
	return <div>TODO: 優化鍵結 {props.bond.name}({energy_icon})</div>;
}
function SimpleArticleCard(props: { meta: ArticleMeta }): JSX.Element {
	const { meta } = props;
	const url = `/app/b/${meta.board_name}/a/${meta.id}`;
	return <div styleName="simpleArticleCard">
		<div key={meta.title}>
			<ArticleLine
				board_name={meta.board_name}
				title={meta.title}
				id={meta.id}
				category_name={meta.category_name} />
			<ArticleHeader
				user_name={meta.author_name}
				board_name={meta.board_name}
				date={new Date(meta.create_time)} />
		</div>
		<Link styleName="overlay" to={url} target="_blank"></Link >
		{/* TODO: 有沒有可能讓上一行不要開新分頁？ */}
	</div >;
}

function SimpleArticleCardById(props: { article_id: number }): JSX.Element {
	let [meta, setMeta] = React.useState<ArticleMeta | null>(null);

	React.useEffect(() => {
		API_FETCHER.queryArticleMeta(props.article_id).then(data => {
			setMeta(unwrap(data));
			// setFetching(false);
		}).catch(err => {
			toastErr(err);
			// setFetching(false);
		});
	}, [props.article_id]);

	// TODO: 改爲 fetching 圖標
	if (meta == null) {
		return <></>;
	} else {
		return <SimpleArticleCard meta={meta} />;
	}
}

function SatelliteCard(props: { meta: ArticleMeta, bond: Edge }): JSX.Element {
	const date_string = relativeDate(new Date(props.meta.create_time));
	return <div styleName="satelliteCard">
		<BondCard bond={props.bond} />
		<div styleName="satelliteHeader">
			<Link to={`/app/user/${props.meta.author_name}`}>
				<div styleName="authorId">{props.meta.author_name}</div>
			</Link>
			<div styleName="articleTime">{date_string} {props.meta.category_name}</div>
		</div>
		<div>
			{props.meta.title}
		</div>
	</div>;
}

export {
	ArticleCard,
	SimpleArticleCardById,
	SimpleArticleCard,
	SatelliteCard,
	BondCard,
};