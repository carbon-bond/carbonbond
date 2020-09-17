import * as React from 'react';
import { RouteComponentProps, Redirect } from 'react-router';
import { MainScrollState } from '../global_state/main_scroll';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, SimpleArticleCard, SimpleArticleCardById } from '../article_card';
import '../../css/board_switch/article_page.css';
import { Article, ArticleMeta, Board } from '../../ts/api/api_trait';
import { toast } from 'react-toastify';
import { parse_category } from 'force';
import { useForce } from '../../tsx/cache';
import { EditorPanelState } from '../global_state/editor_panel';

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

function ArticleDisplayPage(props: { article: Article, board: Board }): JSX.Element {
	let { article, board } = props;

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

	function ReplyButton(props: { category_name: string, field_name: string }): JSX.Element {
		const { openEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
		const onClick = (): void => {
			if (editor_panel_data == null ||
				editor_panel_data.category == '') {
				setEditorPanelData({
					board,
					category: props.category_name,
					title: '',
					content: { [props.field_name]: `${article.meta.id}` }
				});
				openEditorPanel();
			} else if (editor_panel_data.board.id == board.id && editor_panel_data.category == props.category_name) {
				setEditorPanelData({
					...editor_panel_data,
					content: {
						...editor_panel_data.content,
						[props.field_name]: `${article.meta.id}`
					}
				});
				openEditorPanel();
			} else {
				toast.error('尚在編輯其他文章，請關閉後再點擊');
			}
		};
		return <button onClick={onClick}>
			{`${props.category_name}#${props.field_name}`}
		</button>;
	}

	type FieldPath = {
		category: string,
		field: string,
	};

	function ReplyButtons(): JSX.Element {
		let [expanded, setExpanded] = React.useState<Boolean>(false);
		const force = useForce(board.board_name);
		let candidates: FieldPath[] = [];
		if (force) {
			for (let [_, category] of force.categories) {
				for (let field of category.fields) {
					if (field.datatype.kind == 'bond' || field.datatype.kind == 'tagged_bond') {
						let bondee = field.datatype.bondee;
						if (bondee.kind == 'all' || bondee.choices.includes(category_name)) {
							candidates.push({ category: category.name, field: field.name});
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
					// XXX: 這個 key 可能會被惡意製造成重複的
						candidates.map(fp => {
							const key = `${fp.category}#${fp.field}`;
							return <ReplyButton
								category_name={fp.category}
								field_name={fp.field}
								key={key} />;
						}) :
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

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }> & {
	board: Board
};


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
			return <ArticleDisplayPage article={article} board={props.board}/>;
		} else {
			return <Redirect to={`/app/b/${article.meta.board_name}/a/${article.meta.id}`} />;
		}
	} else {
		return <div>找不到文章QQ</div>;
	}
}