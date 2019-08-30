import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { EditorPanelState, UserState, MainScrollState } from '../global_state';

import '../../css/board_page.css';
import { ajaxOperation } from '../../ts/api';
import { relativeDate } from '../../ts/date';
import { ArticleMeta } from '.';

const PAGE_SIZE: number = 10;

type Props = RouteComponentProps<{ board_name: string }>;

// TODO: Show fetching animation before data

async function fetchArticles(
	board_name: string,
	page_size: number,
	offset: number
): Promise<ArticleMeta[]> {
	let res = await ajaxOperation.ArticleList({ board_name, page_size, offset });
	return res.articleList;
}

export function BoardPage(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel } = EditorPanelState.useContainer();
	let board_name = props.match.params.board_name;

	function onEditClick(): void {
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			openEditorPanel({ board_name });
		}
	}

	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);

	React.useEffect(() => {
		fetchArticles(board_name, PAGE_SIZE, 0).then(more_articles => {
			console.log(more_articles);
			setArticles(more_articles);
		});
	}, [board_name]);

	const scrollHandler = React.useCallback((): void => {
		// 第一次載入結束前不要動作
		if (articles.length > 0) {
			console.log('Touch End');
			const length = articles.length;
			fetchArticles(board_name, PAGE_SIZE, length).then(more_articles => {
				// TODO: 載入到最早的文章就停
				if (more_articles.length > 0) {
					console.log(more_articles);
					setArticles([...articles, ...more_articles]);
				}
			});
		}
	}, [articles, board_name]);
	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	return <div className="boardContent">
		{
			(() => {
				if (user_state.login) {
					return <h5 onClick={() => onEditClick()}>發表文章</h5>;
				}
			})()
		}

		<div>
			{
				articles.map((article, idx) => (
					<Link to={`/app/b/${board_name}/a/${article.id}`} key={`article-${idx}`} styleName="articleWrapper">
						<BoardItem article={article} />
					</Link>
				))
			}
		</div>
	</div>;
}

function BoardItem(props: { article: ArticleMeta }): JSX.Element {
	const dateString: string = relativeDate(new Date(props.article.createTime * 1000));
	return (
		<div styleName="articleContainer">
			<div styleName="articleHeader">
				<div styleName="articleType">{ props.article.categoryName }</div>
				<div styleName="authorId">{ props.article.authorId }</div>
				<div styleName="articleTime">{ dateString }</div>
				<div styleName="articleTag">標籤</div>
			</div>
			<div styleName="articleBody">
				<div styleName="leftPart">
					<div styleName="articleTitle">{ props.article.title }</div>
					<div styleName="articleContent">
						{ props.article.content.length ? props.article.content[0].slice(0, 25) : '內文空白' }
					</div>
				</div>
				{/* <div styleName="rightPart">
					<div styleName="articlePic">
						<img src="/img/test.jpg" alt="" />
					</div>
				</div> */}
			</div>
			<div styleName="articleFooter">
				<div styleName="articleBtns">
					<div styleName="articleBtnItem">
						<i className="material-icons">
							question_answer
						</i>
						<span styleName="num">1,297</span>則留言
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							share
						</i>
						分享
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							star
						</i>
						收藏
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							notifications
						</i>
						追蹤
					</div>
				</div>
				<div styleName="articleData">
					<div styleName="articleBtnItemPower">
						<img src="/img/energy.png" alt="" />
						{ props.article.energy }
					</div>
					<div styleName="articleBtnItemFight">
						<img src="/img/fight.png" alt="" />
						500
					</div>
					<div styleName="articleBtnItemPush">
						<img src="/img/push.png" alt="" />
						775
					</div>
				</div>
			</div>
		</div>
	);
}