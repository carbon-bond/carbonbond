import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { MainScrollState } from '../global_state/main_scroll';
import { ArticleCard } from '../article_card';
import { API_FETCHER, unwrap_or } from '../../ts/api/api';
import { Board, ArticleMeta } from '../../ts/api/api_trait';

import '../../css/article_wrapper.css';
import '../../css/board_switch/board_page.css';
import { BoardCacheState } from '../global_state/board_cache';
import * as force_util from '../../ts/force_util';

const PAGE_SIZE: number = 10;

type Props = RouteComponentProps<{ board_name: string }> & {
	board: Board
};

// TODO: Show fetching animation before data

// TODO: 需做分頁管理
async function fetchArticles(
	board_name: string,
	page_size: number,
): Promise<ArticleMeta[]> {
	return unwrap_or(await API_FETCHER.queryArticleList(page_size, null,
		board_name, { BlackList: [force_util.SMALL] }), []);
}

export function BoardPage(props: Props): JSX.Element {
	let board_name = props.board.board_name;

	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);
	const [is_end, set_is_end] = React.useState<boolean>(false);

	const { setCurBoard } = BoardCacheState.useContainer();
	React.useEffect(() => {
		setCurBoard(props.board.board_name);
		// return () => {
		// 	setCurBoard(null);
		// };
	}, [props.board, setCurBoard]);

	React.useEffect(() => {
		fetchArticles(board_name, PAGE_SIZE).then(more_articles => {
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
			articles.map((article, pos) => (
				<div styleName="articleWrapper" key={`${article.id}-${pos}`}>
					<ArticleCard article={article} />
				</div>
			))
		}
	</>;
}
