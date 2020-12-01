import * as React from 'react';
import '../css/board_switch/article_card.css';
import { relativeDate } from '../ts/date';
import { Link } from 'react-router-dom';
import { Article, ArticleMeta } from '../ts/api/api_trait';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { toastErr } from './utils';

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

export function ArticleLine(props: { category_name: string, title: string, id: number }): JSX.Element {

	return <div styleName="articleLine">
		<span styleName="articleType">{props.category_name}</span>
		<span styleName="articleTitle">{props.title}</span>
		<Link  styleName="articleGraphViewIcon" to={`/app/graph/${props.id}`}><span> 🗺</span></Link>
	</div>;
}

export function ArticleFooter(): JSX.Element {
	return <div styleName="articleFooter">
		<div styleName="articleBtns">
			<div styleName="articleBtnItem">
				<i> ☘ </i>
				<span styleName="num">4218</span>鍵能
			</div>
			<div styleName="articleBtnItem">
				<i> 🗯 </i>
				<span styleName="num">1297</span>則留言
			</div>
			<div styleName="articleBtnItem">
				<i> ⮕ </i>
				<span styleName="num">18</span>篇大回文
			</div>
			<div styleName="articleBtnItem">
				<i> ★ </i>
				收藏
			</div>
			<div styleName="articleBtnItem">
				<i> 📎 </i>
				分享
			</div>
		</div>
	</div>;
}

function ArticleCard(props: { article: Article }): JSX.Element {

	const date = new Date(props.article.meta.create_time);
	let user_name = '';
	let category_name = '';
	try {
		user_name = props.article.meta.author_name;
		category_name = props.article.meta.category_name;
	} catch {
		user_name = '未知';
		category_name = '未知';
	}
	const url = `/app/b/${props.article.meta.board_name}/a/${props.article.meta.id}`;
	return (
		<div styleName="articleContainer">
			<ArticleHeader user_name={user_name} board_name={props.article.meta.board_name} date={date} />
			<div styleName="articleBody">
				<div styleName="leftPart">
					<ArticleLine category_name={category_name} title={props.article.meta.title} id={props.article.meta.id}/>
					<div styleName="articleContent">
						{props.article.content}
					</div>
				</div>
			</div>
			<ArticleFooter />
			<Link styleName="overlay" to={url}> </Link >
		</div>
	);
}

function SimpleArticleCard(props: { meta: ArticleMeta }): JSX.Element {
	const { meta } = props;
	const url = `/app/b/${meta.board_name}/a/${meta.id}`;
	return <div styleName="simpleArticleCard">
		<div key={meta.title}>
			<ArticleLine
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

function CommentCard(props: { meta: ArticleMeta }): JSX.Element {
	const date_string =  relativeDate(new Date(props.meta.create_time));
	return <div styleName="commentCard">
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
	CommentCard
};