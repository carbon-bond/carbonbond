import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { MainScrollState } from '../global_state';
import { ArticleCard } from '../article_card';
import { API_FETCHER, unwrap_or } from '../../ts/api/api';
import { Article } from '../../ts/api/api_trait';

import '../../css/article_wrapper.css';
import '../../css/board_switch/board_page.css';

const PAGE_SIZE: number = 10;

type Props = RouteComponentProps<{ board_name: string }>;

// TODO: Show fetching animation before data

// TODO: 需做分頁管理
async function fetchArticles(
	board_name: string,
	page_size: number,
): Promise<Article[]> {
	return  unwrap_or(await API_FETCHER.queryArticleList(null, board_name, page_size), []);
}

export function BoardPage(props: Props): JSX.Element {
	let board_name = props.match.params.board_name;

	const [articles, setArticles] = React.useState<Article[]>([]);
	const [is_end, set_is_end] = React.useState<boolean>(false);

	React.useEffect(() => {
		fetchArticles(board_name, PAGE_SIZE).then(more_articles => {
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
		// const before = articles.slice(-1)[0].id;
		fetchArticles(board_name, PAGE_SIZE).then(more_articles => {
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
					<ArticleCard article={article} />
				</div>
			))
		}
	</>;
}
