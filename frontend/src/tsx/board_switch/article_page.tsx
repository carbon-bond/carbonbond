import * as React from 'react';
import { RouteComponentProps, Redirect } from 'react-router';
import { MainScrollState } from '../global_state/main_scroll';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, SimpleArticleCard, SimpleArticleCardById } from '../article_card';
import '../../css/board_switch/article_page.css';
import { Article, ArticleMeta } from '../../ts/api/api_trait';
import { toast } from 'react-toastify';
import { parse_category } from 'force';
import { useForce } from '../../tsx/cache';

function BigReplyList(props: { article: Article }): JSX.Element {
	// TODO: 從上層傳遞
	const { article } = props;
	// let [fetching, setFetching] = React.useState(true);
	let [metas, setMetas] = React.useState<ArticleMeta[]>([]);

	React.useEffect(() => {
		API_FETCHER.queryBonder(article.meta.id).then(data => {
			setMetas(unwrap(data));
			// setFetching(false);
		}).catch(err => {
			toast.error(err);
			// setFetching(false);
		});
	}, [article.meta.id]);

	return <div styleName="replyCardList">
		{
			metas.map(meta => <SimpleArticleCard key={meta.id} meta={meta} />)
		}
	</div>;
}
function Comments(): JSX.Element {
	return <></>;
}

function SplitLine(props: { text: string }): JSX.Element {
	return <>{
		props.text.split('\n').map(line => {
			return line.length == 0 ?
				<br />
				: <p key={line}>{line}</p>;
		})
	}
	</>;
}

function ArticleContent(props: { article: Article }): JSX.Element {
	const article = props.article;
	const category = parse_category(article.meta.category_source);
	const content = JSON.parse(article.content);

	return <div styleName="articleContent">
		{
			category.fields.map(field =>
				<div styleName="field" key={field.name}>
					<div styleName="fieldName">{field.name}：</div>
					{
						(() => {
							const value = content[field.name];
							if (field.datatype.kind == 'bond') {
								return <div styleName="wrap">
									<SimpleArticleCardById article_id={value} />
								</div>;
							} else {
								return <SplitLine text={`${value}`} />;
							}
						})()
					}
				</div>
			)
		}
	</div>;
}

function ArticleDisplayPage(props: { article: Article, board_name: string }): JSX.Element {
	let { article, board_name } = props;

	let scrollHandler = React.useCallback(() => {
		console.log('成功!!');
	}, []);
	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	// const { editor_panel_data, openEditorPanel, addEdge }
	// 	= EditorPanelState.useContainer();

	const category_name = article.meta.category_name;

	// function onReplyClick(transfuse: Transfuse): void {
	// 	if (editor_panel_data) { // 有文章在編輯中
	// 		try {
	// 			addEdge(article, transfuse);
	// 		} catch (e) {
	// 			matchErrAndShow(e);
	// 		}
	// 	} else { // 發表新文章
	// 		openEditorPanel({
	// 			title: genReplyTitle(article.title),
	// 			board_name,
	// 			reply_to: { article, transfuse }
	// 		}).catch(e => matchErrAndShow(e));
	// 	}
	// }

	// function ReplyButton(porps: { category_name: string, field_name: string }): JSX.Element {

	// }

	function ReplyButtons(): JSX.Element {
		let [expanded, setExpanded] = React.useState<Boolean>(false);
		const force = useForce(board_name);
		let candidates = [];
		if (force) {
			for (let [_, category] of force.categories) {
				for (let field of category.fields) {
					if (field.datatype.kind == 'bond' || field.datatype.kind == 'tagged_bond') {
						let bondee = field.datatype.bondee;
						if (bondee.kind == 'all' || bondee.choices.includes(category_name)) {
							candidates.push(`${category.name}#${field.name}`);
						}
					}
				}
			}
		}
		return <div>
			<button onClick={() => setExpanded(!expanded)}>鍵結到本文</button>
			<div styleName="offset">
				{
					expanded ?
						candidates.map(c => <button key={c}>{c}</button>) :
						<></>
				}
			</div>
		</div>;
	}
	return <div styleName="articlePage">
		<ArticleHeader
			user_name={article.meta.author_name}
			board_name={article.meta.board_name}
			date={new Date(article.meta.create_time)} />
		<ArticleLine
			category_name={category_name}
			title={article.meta.title} />
		<ReplyButtons />
		<ArticleContent article={article} />
		<ArticleFooter />
		<BigReplyList article={article}/>
		<Comments />
	</div>;
}

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }>;

export function ArticlePage(props: Props): JSX.Element {
	let article_id = parseInt(props.match.params.article_id!);
	let board_name = props.match.params.board_name;
	let [fetching, setFetching] = React.useState(true);
	let [article, setArticle] = React.useState<Article | null>(null);

	React.useEffect(() => {
		API_FETCHER.queryArticle(article_id).then(data => {
			setArticle(unwrap(data));
			setFetching(false);
		}).catch(err => {
			toast.error(err);
			setFetching(false);
		});
	}, [article_id, board_name, props.history]);

	if (fetching) {
		return <></>;
	} else if (article) {
		if (board_name) {
			return <ArticleDisplayPage article={article} board_name={board_name}/>;
		} else {
			return <Redirect to={`/app/b/${article.meta.board_name}/a/${article.meta.id}`} />;
		}
	} else {
		return <div>找不到文章QQ</div>;
	}
}