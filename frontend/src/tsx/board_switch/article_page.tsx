import * as React from 'react';
import { RouteComponentProps, Redirect } from 'react-router';
import { MainScrollState } from '../global_state/main_scroll';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter } from '../article_card';
import style from '../../css/board_switch/article_page.module.css';
import { Article, Board } from '../../ts/api/api_trait';
import { isImageLink, isLink } from '../../ts/regex_util';
import { toastErr } from '../utils';
import { BonderCards, ReplyButtons, SatelliteButtons, SatelliteCards } from '../article_card/bonder';

function ReplyList(props: { article: Article }): JSX.Element {
	// TODO: 從上層傳遞
	const { article } = props;
	let [expanded, setExpanded] = React.useState<boolean>(false);

	return <div className={style.replyCardList}>
		<div className={style.listTitle} onClick={() => setExpanded(!expanded)}>
			<span className={style.toggleButton}> {expanded ? '⯆' : '⯈'} </span>
			<span>{article.meta.stat.replies} 篇回文</span>
		</div>
		<div>
			<BonderCards expanded={expanded} article={article.meta} />
		</div>
	</div>;
}

function Satellites(props: { article: Article, board: Board }): JSX.Element {
	const { article, board } = props;
	let [expanded, setExpanded] = React.useState<boolean>(true);

	return <div className={style.satellites}>
		<div className={style.listTitle} onClick={() => setExpanded(!expanded)}>
			<span className={style.toggleButton}>{expanded ? '⯆' : '⯈'} </span>
			<span>{article.meta.stat.satellite_replies} 則衛星</span>
		</div>
		<div className={style.contents}>
			<div>
				<SatelliteCards expanded={expanded} article={article.meta} />
			</div>
			<div>
				<SatelliteButtons board={board} article={article.meta} />
			</div>
		</div>
	</div>;
}

export function ShowText(props: { text: string }): JSX.Element {
	let key = 0;
	return <>{
		props.text.split('\n').map(line => {
			if (line.length == 0) {
				// 換行
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
					<div className={style.fieldName}>{field.name}：</div>
					<ShowText text={content[field.name]} />
				</div>
			)
		}
	</div>;
}

function ArticleDisplayPage(props: { article: Article, board: Board }): JSX.Element {
	let { article, board } = props;
	let { useScrollToBottom } = MainScrollState.useContainer();
	let scrollHandler = React.useCallback(() => { }, []);
	useScrollToBottom(scrollHandler);

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
		<ArticleFooter article={article.meta} />
		<ReplyList article={article} />
		<Satellites article={article} board={board} />
	</div>;
}

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }> & {
	board: Board
};

export function ArticlePage(props: Props): JSX.Element {
	let article_id = parseInt(props.match.params.article_id!);
	let board_name = props.match.params.board_name;
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
	}, [article_id, board_name, props.history]);

	if (fetching) {
		return <></>;
	} else if (article) {
		if (board_name) {
			return <ArticleDisplayPage article={article} board={props.board} />;
		} else {
			return <Redirect to={`/app/b/${article.meta.board_name}/a/${article.meta.id}`} />;
		}
	} else {
		return <div>找不到文章QQ</div>;
	}
}