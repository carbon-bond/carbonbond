import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { MainScrollState } from '../global_state';

import '../../css/board_switch/board_page.css';
import { ajaxOperation } from '../../ts/api';
import { ArticleMeta } from '.';
import { ArticleHeader, ArticleLine, ArticleFooter } from './article_meta';

const PAGE_SIZE: number = 10;

type Props = RouteComponentProps<{ board_name: string }>;

// TODO: Show fetching animation before data

async function fetchArticles(
	board_name: string,
	page_size: number,
	before: string | null
): Promise<ArticleMeta[]> {
	let res = await ajaxOperation.ArticleList({ board_name, page_size, before, show_hidden: false });
	return res.articleList;
}

export function BoardPage(props: Props): JSX.Element {
	let board_name = props.match.params.board_name;

	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);
	const [is_end, set_is_end] = React.useState<boolean>(false);

	React.useEffect(() => {
		fetchArticles(board_name, PAGE_SIZE, null).then(more_articles => {
			console.log(more_articles);
			setArticles(more_articles);
		});
	}, [board_name]);

	const scrollHandler = React.useCallback((): void => {
		// 第一次載入結束前 or 已經載到最早的文章了，不要動作
		if (articles.length == 0 || is_end) {
			return;
		}
		console.log('Touch End');
		const before = articles.slice(-1)[0].id;
		fetchArticles(board_name, PAGE_SIZE, before).then(more_articles => {
			if (more_articles.length > 0) {
				console.log(more_articles);
				setArticles([...articles, ...more_articles]);
			} else {
				set_is_end(true);
			}
		});
	}, [articles, board_name, is_end]);

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

	const date = new Date(props.article.createTime);
	let user_name = '';
	let category_name = '';
	try {
		user_name = props.article.author.userName;
		category_name = JSON.parse(props.article.category.body).name;
	} catch {
		user_name = '未知';
		category_name = '未知';
	}

	return (
		<div styleName="articleContainer">
			<ArticleHeader user_name={user_name} board_name={props.article.board.boardName} date={date} />
			<Link to={`/app/b/${props.article.board.boardName}/a/${props.article.id}`}>
				<div styleName="articleBody">
					<div styleName="leftPart">
						<ArticleLine category_name={category_name} title={props.article.title} />
						<div styleName="articleContent">
							{props.article.content}
						</div>
					</div>
				</div>
			</Link>
			<ArticleFooter />
		</div>
	);
}