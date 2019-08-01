import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getGraphQLClient, extractErrMsg } from '../../ts/api';
import { toast } from 'react-toastify';
import '../../css/article_page.css';
import { ScrollState, EditorPanelState, Transfuse } from '../global_state';
import { Article } from '.';
import { ArticleMetaBlock } from './article_meta_block';
import { checkCanReply, genReplyTitle } from '../../ts/forum_util';

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

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }>;
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
					title: genReplyTitle(article.title),
					board_name,
					reply_to: { article, transfuse }
				}).catch(e => toast.error(extractErrMsg(e)));
			}
		}
	}

	function ReplyBtn(props: { transfuse: Transfuse, label: string }): JSX.Element {
		let can_reply = article && checkCanReply(editor_panel_data, article, props.transfuse);
		if (can_reply) {
			return <div styleName="reply" onClick={() => onReplyClick(props.transfuse)}>
				{props.label}
			</div>;
		} else {
			return <div styleName="cantReply">{props.label}</div>;
		}
	}

	let { useScrollToBottom } = ScrollState.useContainer();
	let ref = React.useRef(null);
	useScrollToBottom(ref, () => {
		console.log('成功!!');
	});

	if (fetching) {
		return <></>;
	} else if (article) {
		return <div ref={ref} styleName="articlePage">
			<ArticleMetaBlock article={article} />
			<hr />
			<div>
				{
					article.content.map((txt, i) => {
						return <div key={i}>{txt}</div>;
					})
				}
			</div>
			<ReplyBtn label="挺" transfuse={1}/>
			<ReplyBtn label="回" transfuse={0}/>
			<ReplyBtn label="戰" transfuse={-1}/>
		</div>;
	} else {
		return <div>找不到文章QQ</div>;
	}
}