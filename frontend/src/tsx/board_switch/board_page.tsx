import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { MainScrollState } from '../global_state';

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
	let board_name = props.match.params.board_name;

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

	return <>
		{
			articles.map((article, idx) => (
				<div styleName="articleWrapper" key={`article-${idx}`}>
					<BoardItem article={article} />
				</div>
			))
		}
	</>;
}

function BoardItem(props: { article: ArticleMeta }): JSX.Element {
	const dateString: string = relativeDate(new Date(props.article.createTime));

	let userName = '';
	let categoryName = '';
	try {
		userName = props.article.author.userName;
		categoryName = JSON.parse(props.article.category.body).name;
	} catch {
		userName = '未知';
		categoryName = '未知';
	}

	return (
		<div styleName="articleContainer">
			<div styleName="articleHeader">
				<div styleName="authorId">{userName}</div>
				發佈於
				<div styleName="articleBoard">{props.article.board.boardName}</div>
				<div styleName="seperationDot">•</div>
				<div styleName="articleTime">{dateString}</div>
			</div>
			<Link to={`/app/b/${props.article.board.boardName}/a/${props.article.id}`}>
				<div styleName="articleBody">
					<div styleName="leftPart">
						<div styleName="firstLine">
							<span styleName="articleType">{categoryName}</span>
							<span styleName="articleTitle">{props.article.title}</span>
						</div>
						<div styleName="articleContent">
							{props.article.content}
						</div>
					</div>
				</div>
			</Link>
			<div styleName="articleFooter">
				<div styleName="articleBtns">
					<div styleName="articleBtnItem">
						<i className="material-icons">
							flash_on
						</i>
						<span styleName="num">4218</span>鍵能
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							question_answer
						</i>
						<span styleName="num">1297</span>則留言
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							forward
						</i>
						<span styleName="num">18</span>篇大回文
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							star
						</i>
						收藏
					</div>
					<div styleName="articleBtnItem">
						<i className="material-icons">
							share
						</i>
						分享
					</div>
				</div>
			</div>
		</div>
	);
}