import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getGraphQLClient, extractErrMsg } from '../../ts/api';
import { toast } from 'react-toastify';
import '../../css/article_page.css';
import { ScrollState, EditorPanelState, Transfuse } from '../global_state';
import { Article } from '.';
import { ArticleMetaBlock } from './article_meta_block';
import { checkCanRelply } from '../../ts/forum_util';

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }>;
async function fetchArticleDetail(id: string): Promise<Article> {
	let client = getGraphQLClient();
	const query = `
			query ArticleDetail($id: ID!) {
				article(id: $id) {
					id, title, authorId, energy, createTime, rootId
					content, raw_category:category { body },
					board { boardName }
				}
			}
		`;
	let res: { article: Article } = await client.request(query, { id });
	let article = res.article;
	article.category = JSON.parse(article.raw_category.body);
	return article;
}

export function ArticlePage(props: Props): JSX.Element {
	let article_id = props.match.params.article_id;
	let board_name = props.match.params.board_name;
	let [fetching, setFetching] = React.useState(true);
	let [article, setArticle] = React.useState<Article | null>(null);

	React.useEffect(() => {
		if (typeof article_id == 'string') {
			fetchArticleDetail(article_id).then(a => {
				if (!board_name || a.board.boardName != board_name) {
					props.history.replace(`/app/b/${a.board.boardName}/a/${a.id}`);
				}
				setArticle(a);
				setFetching(false);
			}).catch(err => {
				toast.error(extractErrMsg(err));
				setFetching(false);
			});
		} else {
			setFetching(false);
		}
	}, [article_id, board_name, props.history]);

	const { editor_panel_data, openEditorPanel, addEdge }
		= EditorPanelState.useContainer();

	function onReplyClick(transfuse: Transfuse): void {
		if (article) {
			if (editor_panel_data) {
				try {
					addEdge(article, transfuse);
				} catch (e) {
					toast.error(extractErrMsg(e));
				}
			} else if (board_name && article) {
				openEditorPanel({
					title: `Re: ${article.title}`,
					board_name,
					replying: { article, transfuse }
				}).catch(e => toast.error(extractErrMsg(e)));
			}
		}
	}

	let { useScrollToBottom } = ScrollState.useContainer();
	let ref = React.useRef(null);
	useScrollToBottom(ref, () => {
		console.log('成功!!');
	});

	if (fetching) {
		return <div />;
	} else if (article) {
		return <div ref={ref} styleName='articlePage'>
			<ArticleMetaBlock article={article} />
			<hr />
			<div>
				{
					article.content.map((txt, i) => {
						return <div key={i}>{txt}</div>;
					})
				}
			</div>
			{
				checkCanRelply(editor_panel_data, article.category, 1) ?
					<div onClick={() => onReplyClick(1)}>挺</div> : null
			}
			{
				checkCanRelply(editor_panel_data, article.category, 0) ?
					<div onClick={() => onReplyClick(0)}>回</div> : null
			}
			{
				checkCanRelply(editor_panel_data, article.category, -1) ?
					<div onClick={() => onReplyClick(-1)}>鬥</div> : null
			}
		</div>;
	} else {
		return <div>找不到文章QQ</div>;
	}
}