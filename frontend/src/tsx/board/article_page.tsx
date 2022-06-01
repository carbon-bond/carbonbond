import * as React from 'react';
import { Navigate, useParams } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, Hit, NormalBondLines } from '../article_card';
import style from '../../css/board/article_page.module.css';
import { Article, ArticleMeta, Board, force } from '../../ts/api/api_trait';
import { toastErr, useMainScroll } from '../utils';
import { ReplyButtons } from '../article_card/bonder';
import { ArticleSidebar } from './right_sidebar';
import { ArticleLocation, LocationState } from '../global_state/location';
import { BoardInfo, useBoardInfo } from '.';
import { ShowText } from '../display/show_text';
import { EditorPanelState } from '../global_state/editor_panel';

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
			article_meta={props.article.meta}
			date={new Date(article.meta.create_time)} />
		<div className={style.articleLineWrap}>
			<ArticleLine
				board_info={props.board}
				id={article.meta.id}
				category={category}
				title={article.meta.title} />
			<NormalBondLines bonds={props.article.bonds} />
		</div>
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
	const { setCurrentLocation } = LocationState.useContainer();
	const {setUpdatedArticleId, updated_article_id } = EditorPanelState.useContainer();

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

	// 更新文章完成時，重新取得文章資料
	React.useEffect(() => {
		if (article && updated_article_id == article_id) {
			API_FETCHER.articleQuery.queryArticle(article_id)
			.then((article) => {
				setArticle(unwrap(article));
			}).catch(err => {
				toastErr(err);
			});
		}
		setUpdatedArticleId(null);
	}, [updated_article_id, article_id, article, setUpdatedArticleId]);

	React.useEffect(() => {
		setCurrentLocation(
			board_info.name ?
				new ArticleLocation(board_info.name, article?.meta.title || '') :
				null
		);
	}, [setCurrentLocation, board_info.name, article]);

	if (fetching) {
		return <></>;
	} else if (article && board) {
		if (board_info.name) {
			return <div className="content">
				<div className="mainContent">
					<ArticleDisplayPage article={article} board={board} />
				</div>
				{window.is_mobile ? <></> : <ArticleSidebar article={article}/>}
			</div>;
		} else {
			return <Navigate to={`${board_info.to_url()}/article/${article.meta.id}`} />;
		}
	} else {
		return <div>{`文章代碼 ${article_id} ：不存在`}</div>;
	}
}

// 網址僅有文章 id 而無看板資訊時，以此元件進行轉址
export function ArticleRedirect(): JSX.Element {
	let params = useParams();
	let article_id = parseInt(params.article_id!);
	let [article, setArticle] = React.useState<ArticleMeta | null>(null);
	React.useEffect(() => {
		API_FETCHER.articleQuery.queryArticleMeta(article_id)
		.then((article) => {
			setArticle(unwrap(article));
		}).catch(err => {
			toastErr(err);
		});
	}, [article_id]);

	if (article == null) {
		return <div></div>;
	} else {
		let board_info = new BoardInfo(article.board_name, article.board_type);
		return <Navigate to={`${board_info.to_url()}/article/${article_id}`} />;
	}
}