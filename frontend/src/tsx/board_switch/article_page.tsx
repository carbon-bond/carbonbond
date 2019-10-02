import * as React from 'react';
import { RouteComponentProps, Redirect } from 'react-router';
import { ajaxOperation, extractErrMsg } from '../../ts/api';
import { toast } from 'react-toastify';
import '../../css/board_switch/article_page.css';
import { MainScrollState, EditorPanelState, Transfuse } from '../global_state';
import { checkCanReply, genReplyTitle } from '../../ts/forum_util';
import { Article } from '.';
import { ArticleHeader, ArticleLine, ArticleFooter } from './article_meta';

async function fetchArticleDetail(id: string): Promise<Article> {
	let res = await ajaxOperation.ArticleDetail({ id });
	return res.article;
}

function ArticleDisplayPage(props: { article: Article, board_name: string }): JSX.Element {
	let { article, board_name } = props;

	let scrollHandler = React.useCallback(() => {
		console.log('成功!!');
	}, []);
	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	const { editor_panel_data, openEditorPanel, addEdge }
		= EditorPanelState.useContainer();

	const category_name = JSON.parse(props.article.category.body).name;

	function onReplyClick(transfuse: Transfuse): void {
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

	function ReplyBtn(props: { transfuse: Transfuse, label: string }): JSX.Element {
		let can_reply = checkCanReply(editor_panel_data, article, props.transfuse);
		if (can_reply) {
			return <span styleName="reply" onClick={() => onReplyClick(props.transfuse)}>
				{props.label}
			</span>;
		} else {
			return <div styleName="cantReply">{props.label}</div>;
		}
	}
	return <div styleName="articlePage">
		<ArticleHeader
			user_name={article.author.userName}
			board_name={article.board.boardName}
			date={new Date(article.createTime)} />
		<ArticleLine
			category_name={category_name}
			title={article.title} />
		<div styleName="articleContent">
			{
				article.content.map((txt, i) => {
					return <div key={i}>
						{txt.split('\n').map(line => {
							return line.length == 0 ?
								<br />
								: <p key={line}>{line}</p>;
						})}
					</div>;
				})
			}
		</div>
		<ArticleFooter />
		<ReplyBtn label="戰" transfuse={-1} />
		<ReplyBtn label="挺" transfuse={1} />
		<ReplyBtn label="回" transfuse={0} />
	</div>;

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
	if (fetching) {
		return <></>;
	} else if (article) {
		if (board_name) {
			return <ArticleDisplayPage article={article} board_name={board_name}/>;
		} else {
			return <Redirect to={`/app/b/${article.board.boardName}/a/${article.id}`} />;
		}
	} else {
		return <div>找不到文章QQ</div>;
	}
}