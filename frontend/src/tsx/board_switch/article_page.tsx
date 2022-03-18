import * as React from 'react';
import { Navigate, useParams } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, Hit } from '../article_card';
import style from '../../css/board_switch/article_page.module.css';
import { Article, Board, force } from '../../ts/api/api_trait';
import { isImageLink, isLink } from '../../ts/regex_util';
import { toastErr, useMainScroll } from '../utils';
import { ReplyButtons } from '../article_card/bonder';
import { ArticleSidebar } from './right_sidebar';
import { useDocumentTitle } from '../utils';


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
			board_name={article.meta.board_name}
			date={new Date(article.meta.create_time)} />
		<ArticleLine
			board_name={article.meta.board_name}
			id={article.meta.id}
			category={category}
			title={article.meta.title} />
		<ReplyButtons article={article.meta} board={board} />
		<ArticleContent article={article} />
		<ArticleFooter article={article.meta} hit={Hit.Comment} />
	</div>;
}

export function ArticlePage(props: { board: Board}): JSX.Element {
	let params = useParams();
	let article_id = parseInt(params.article_id!);
	let board_name = params.board_name;
	let [fetching, setFetching] = React.useState(true);
	let [article, setArticle] = React.useState<Article | null>(null);

	React.useEffect(() => {
		API_FETCHER.articleQuery.queryArticle(article_id).then(data => {
			setArticle(unwrap(data));
			setFetching(false);
		}).catch(err => {
			toastErr(err);
			setFetching(false);
		});
	}, [article_id, board_name]);

	useDocumentTitle(`${article ? article.meta.board_name : ''}/${article ? article.meta.title : ''}`);

	if (fetching) {
		return <></>;
	} else if (article) {
		if (board_name) {
			return <>
				<div className="mainContent">
					<ArticleDisplayPage article={article} board={props.board} />
				</div>
				{window.is_mobile ? <></> : <ArticleSidebar author={article.meta.author}/>}
			</>;
		} else {
			return <Navigate to={`/app/b/${article.meta.board_name}/a/${article.meta.id}`} />;
		}
	} else {
		return <div>{`文章代碼 ${article_id} ：不存在`}</div>;
	}
}