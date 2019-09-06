import * as React from 'react';
import { RouteComponentProps, Redirect } from 'react-router';
import { ajaxOperation, matchErrAndShow } from '../../ts/api';
import '../../css/article_page.css';
import { MainScrollState, EditorPanelState, Transfuse } from '../global_state';
import { ArticleMetaBlock } from './article_meta_block';
import { checkCanReply, genReplyTitle } from '../../ts/forum_util';
import { Article } from '.';

function ArticleDisplayPage(props: { article: Article, board_name: string }): JSX.Element {
	let { article, board_name } = props;

	let scrollHandler = React.useCallback(() => {
		console.log('成功!!');
	}, []);
	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	const { editor_panel_data, openEditorPanel, addEdge }
		= EditorPanelState.useContainer();

	function onReplyClick(transfuse: Transfuse): void {
		if (editor_panel_data) { // 有文章在編輯中
			try {
				addEdge(article, transfuse);
			} catch (e) {
				matchErrAndShow(e);
			}
		} else { // 發表新文章
			openEditorPanel({
				title: genReplyTitle(article.title),
				board_name,
				reply_to: { article, transfuse }
			}).catch(e => matchErrAndShow(e));
		}
	}

	function ReplyBtn(props: { transfuse: Transfuse, label: string }): JSX.Element {
		let can_reply = checkCanReply(editor_panel_data, article, props.transfuse);
		if (can_reply) {
			return <div styleName="reply" onClick={() => onReplyClick(props.transfuse)}>
				{props.label}
			</div>;
		} else {
			return <div styleName="cantReply">{props.label}</div>;
		}
	}
	return <div styleName="articlePage">
		<ArticleMetaBlock article={article} />
		<hr />
		<div>
			{
				article.content.map((txt, i) => {
					return <div key={i}>{txt}</div>;
				})
			}
		</div>
		<ReplyBtn label="挺" transfuse={1} />
		<ReplyBtn label="回" transfuse={0} />
		<ReplyBtn label="戰" transfuse={-1} />
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
			ajaxOperation.ArticleDetail({ id: article_id }).then(res => {
				setArticle(res.article);
				setFetching(false);
			}).catch(err => {
				matchErrAndShow(err, ['NOT_FOUND', '找不到文章']);
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