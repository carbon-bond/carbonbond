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
	min_id: null | number,
	setMinID: (min_id: number) => void
): Promise<ArticleMeta[]> {
	let articles = unwrap_or(await API_FETCHER.queryArticleList(page_size, min_id, null,
		board_name, { BlackList: [force_util.SATELLITE] }), []);
	let new_min = Math.min(...articles.map(a => a.id));
	if (min_id != null) {
		new_min = Math.min(min_id, new_min);
	}
	setMinID(new_min);
	return articles;
}

export function BoardPage(props: Props): JSX.Element {
	let board_name = props.board.board_name;

	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);
	const [min_article_id, setMinArticleID] = React.useState<number | null>(null);
	const [is_end, setIsEnd] = React.useState<boolean>(false);
	const min_article_id_ref = React.useRef<null | number>(0);
	min_article_id_ref.current = min_article_id;

	const { setCurBoard } = BoardCacheState.useContainer();
	React.useLayoutEffect(() => {
		console.log(`開始載入 ${board_name}`);
		setCurBoard(board_name);
		setMinArticleID(null);
		setIsEnd(false);
		fetchArticles(board_name, PAGE_SIZE, null, setMinArticleID).then(more_articles => {
			setArticles(more_articles);
		});
	}, [board_name, setCurBoard]);

	const scrollHandler = React.useCallback((): void => {
		// 第一次載入結束前 or 已經載到最早的文章了，不要動作
		if (is_end) {
			return;
		}
		console.log(`Touch End ${board_name}`);
		// const before = articles.slice(-1)[0].id;
		fetchArticles(board_name, PAGE_SIZE, min_article_id_ref.current, setMinArticleID).then(more_articles => {
			if (more_articles.length > 0) {
				setArticles([...articles, ...more_articles]);
			} else {
				setIsEnd(true);
			}
		});
	}, [articles, min_article_id_ref, is_end, board_name]);

	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	return <>
		{
			articles.map((article, pos) => (
				<div className="articleWrapper" key={`${article.id}-${pos}`}>
					<ArticleCard article={article} />
				</div>
			))
		}
	</>;
}
