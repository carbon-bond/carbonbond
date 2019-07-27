import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getGraphQLClient, extractErrMsg } from '../../ts/api';
import { toast } from 'react-toastify';
import '../../css/article_page.css';
import { ScrollState, EditorPanelState } from '../global_state';
import { Article } from '.';
import { ArticleMetaBlock } from './article_meta_block';

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }>;
async function fetchArticleDetail(id: string): Promise<Article> {
	let client = getGraphQLClient();
	const query = `
			query ArticleDetail($id: ID!) {
				article(id: $id) {
					id, title, authorId, energy, createTime,
					content, raw_category:category { body }
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
				setArticle(a);
				setFetching(false);
			}).catch(err => {
				toast.error(extractErrMsg(err));
				setFetching(false);
			});
		} else {
			setFetching(false);
		}
	}, [article_id]);

	const { editor_panel_data, openEditorPanel, setEditorPanelData }
		= EditorPanelState.useContainer();

	function onReplyClick(): void {
		if (article) {
			let edge = { article_id: article.id, transfuse: 0, category: article.category };
			if (editor_panel_data) {
				setEditorPanelData(data => {
					if (data) {
						data.edges.push(edge);
						return data;
					} else {
						return null;
					}
				});
			} else if (board_name && article) {
				openEditorPanel({
					board_name,
					replying: edge
				});
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
			<div onClick={() => onReplyClick()}>回覆</div>
		</div>;
	} else {
		return <div>找不到文章QQ</div>;
	}
}