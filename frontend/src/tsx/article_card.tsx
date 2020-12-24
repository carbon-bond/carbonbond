import * as React from 'react';
import '../css/board_switch/article_card.css';
import { UserState } from './global_state/user';
import { relativeDate } from '../ts/date';
import { Link } from 'react-router-dom';
import { ArticleMeta, Edge } from '../ts/api/api_trait';
import { API_FETCHER, unwrap, unwrap_or } from '../ts/api/api';
import { toastErr } from './utils';
import { parse_category } from 'force';

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
		<span styleName="articleTitle">{props.title}</span>
		<Link styleName="articleGraphViewIcon" to={`/app/b/${props.board_name}/graph/${props.id}`}><span> 🗺</span></Link>
	</div>;
}

export function ArticleFooter(props: { article: ArticleMeta }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [favorite, setFavorite] = React.useState<boolean>(false);

	async function fetchFavorites(): Promise<ArticleMeta[]> {
		if (user_state.login) {
			console.log('has login');
			return unwrap_or(await API_FETCHER.queryMyFavoriteArticleList(), []);
		} else {
			console.log('no login');
			return [];
		}
	}

	Promise.all([
		fetchFavorites(),
	]).then(([more_favorites]) => {
		try {
			setFavorite(more_favorites.some(article => article.id == props.article.id));
		} catch (err) {
			toastErr(err);
		}
	});

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

	return <div styleName="articleFooter">
		<div styleName="articleBtns">
			<div styleName="articleBtnItem">
				☘️<span styleName="num">{props.article.energy}</span>鍵能
			</div>
			<div styleName="articleBtnItem">
				🗯️<span styleName="num">1297</span>則留言
			</div>
			<div styleName="articleBtnItem">
				➡️<span styleName="num">18</span>篇大回文
			</div>
			<div styleName="articleBtnItem" onClick={() => onFavoriteArticleClick()}>
				{favorite ? '🌟取消收藏' : '⭐收藏'}
			</div>
			<div styleName="articleBtnItem">
				📎分享
			</div>
		</div>
	</div>;
}

function ArticleCard(props: { article: ArticleMeta }): JSX.Element {
	const date = new Date(props.article.create_time);
	let user_name = '';
	let category_name = '';
	try {
		user_name = props.article.author_name;
		category_name = props.article.category_name;
	} catch {
		user_name = '未知';
		category_name = '未知';
	}
	const url = `/app/b/${props.article.board_name}/a/${props.article.id}`;

	const category = parse_category(props.article.category_source);
	// eslint-disable-next-line
	let content: { [name: string]: any } = JSON.parse(props.article.digest);
	function Content(): JSX.Element[] {
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
		return category.fields.map(field => {
			let inner = formatValue(content[field.name]);
			if (inner.length == 0) {
				return <></>;
			}
			return <>
				{show_name ? <h4>{field.name}</h4> : null}
				<pre styleName="articleContent">{inner}</pre>
			</>;
		});
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
					{Content()}
				</div>
			</div>
			<ArticleFooter article={props.article} />
			<Link styleName="overlay" to={url}> </Link >
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
		<Link styleName="overlay" to={url}></Link >
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

function CommentCard(props: { meta: ArticleMeta, bond: Edge }): JSX.Element {
	const date_string = relativeDate(new Date(props.meta.create_time));
	return <div styleName="commentCard">
		<BondCard bond={props.bond} />
		<div styleName="commentHeader">
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
	CommentCard,
	BondCard
};