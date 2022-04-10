import * as React from 'react';
import { Navigate, useParams } from 'react-router';
import { useTitle } from 'react-use';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, Hit } from '../article_card';
import style from '../../css/board/article_page.module.css';
import { Article, Board, force } from '../../ts/api/api_trait';
import { isImageLink, isLink } from '../../ts/regex_util';
import { toastErr, useMainScroll } from '../utils';
import { ReplyButtons } from '../article_card/bonder';
import { ArticleSidebar } from './right_sidebar';
import { LocationCacheState } from '../global_state/location_cache';
import { board_info_to_url, useBoardInfo } from '.';

export function ShowText(props: { text: string }): JSX.Element {
	let key = 0;
	return <>{
		props.text.split('\n').map(line => {
			if (/^\s*$/.test(line)) {
				// 若整行都是空的，換行
				return <br key={key++} />;
			} else if (isImageLink(line.trim())) {
				return <>
					<p key={key++}>
						<a target="_blank" href={line}>
							{line}
							<img key={key++} src={line.trim()} width="100%" alt="圖片" />
						</a>
					</p>
				</>;
			} else if (isLink(line.trim())) {
				return <p key={key++}>
					<a target="_blank" href={line}>{line}</a>
				</p>;
			} else {
				return <p key={key++}>{line}</p>;
			}
		})
	}
	</>;
}


export function ArticleContent(props: { article: Article }): JSX.Element {
	const article = props.article;
	const fields = article.meta.fields;
	const content = JSON.parse(article.content);

	return <div className={style.articleContent}>
		{
			fields.map(field =>
				<div className={style.field} key={field.name}>
					{
						field.name == '' ?
							<></> :
							<div className={style.fieldName}>{field.name}：</div>
					}
					{
						(field.kind == force.FieldKind.MultiLine || field.kind == force.FieldKind.OneLine) ?
							<ShowText text={content[field.name]} /> :
							content[field.name]
					}
				</div>
			)
		}
	</div>;
}

function ArticleDisplayPage(props: { article: Article, board: Board }): JSX.Element {
	let { article, board } = props;
	let { useMainScrollToBottom } = useMainScroll();
	let scrollHandler = React.useCallback(() => { }, []);
	useMainScrollToBottom(scrollHandler);

	const category = article.meta.category;

	return <div className={style.articlePage}>
		<ArticleHeader
			author={article.meta.author}
			board_info={props.board}
			date={new Date(article.meta.create_time)} />
		<ArticleLine
			board_info={props.board}
			id={article.meta.id}
			category={category}
			title={article.meta.title} />
		<ReplyButtons article={article.meta} board={board} />
		<ArticleContent article={article} />
		<ArticleFooter article={article.meta} hit={Hit.Comment} />
	</div>;
}

export function ArticlePage(): JSX.Element {
	let params = useParams();
	let article_id = parseInt(params.article_id!);
	let board_info = useBoardInfo();
	let [fetching, setFetching] = React.useState(true);
	let [article, setArticle] = React.useState<Article | null>(null);
	let [board, setBoard] = React.useState<Board | null>(null);
	const { setCurrentLocation } = LocationCacheState.useContainer();

	React.useEffect(() => {
		Promise.all([API_FETCHER.boardQuery.queryBoard(board_info.name, board_info.type), API_FETCHER.articleQuery.queryArticle(article_id)])
		.then(([board, article]) => {
			setBoard(unwrap(board));
			setArticle(unwrap(article));
			setFetching(false);
		}).catch(err => {
			toastErr(err);
			setFetching(false);
		});
	}, [article_id, board_info.name, board_info.type]);

	React.useEffect(() => {
		setCurrentLocation(board_info.name ? {name: board_info.name, is_article_page: true} : null);
	}, [setCurrentLocation, board_info.name]);
	useTitle(article?.meta.title || '');

	if (fetching) {
		return <></>;
	} else if (article && board) {
		if (board_info.name) {
			return <div className="content">
				<div className="mainContent">
					<ArticleDisplayPage article={article} board={board} />
				</div>
				{window.is_mobile ? <></> : <ArticleSidebar author={article.meta.author}/>}
			</div>;
		} else {
			return <Navigate to={`${board_info_to_url(board_info)}/article/${article.meta.id}`} />;
		}
	} else {
		return <div>{`文章代碼 ${article_id} ：不存在`}</div>;
	}
}