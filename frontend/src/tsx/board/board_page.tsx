import * as React from 'react';

import { ArticleCard } from '../article_card';
import { API_FETCHER, unwrap_or } from '../../ts/api/api';
import { Board, ArticleMetaWithBonds } from '../../ts/api/api_trait';

import aritcle_wrapper_style from '../../css/article_wrapper.module.css';
const { articleWrapper } = aritcle_wrapper_style;
import { BoardLocation, LocationState } from '../global_state/location';
import { useMainScroll } from '../utils';
import { BoardSidebar } from './right_sidebar';

const PAGE_SIZE: number = 10;

// TODO: Show fetching animation before data

// TODO: 需做分頁管理
async function fetchArticles(
	board_name: string,
	page_size: number,
	min_id: null | number,
	setMinID: (min_id: number) => void
): Promise<ArticleMetaWithBonds[]> {
	let articles = unwrap_or(await API_FETCHER.articleQuery.queryArticleList(page_size, min_id, null,
		board_name), []);
	let new_min = Math.min(...articles.map(a => a.meta.id));
	if (min_id != null) {
		new_min = Math.min(min_id, new_min);
	}
	setMinID(new_min);
	return articles;
}

export function BoardBody(props: {board: Board}): JSX.Element {
	let board_name = props.board.board_name;
	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);
	const [min_article_id, setMinArticleID] = React.useState<number | null>(null);
	const [is_end, setIsEnd] = React.useState<boolean>(false);
	const min_article_id_ref = React.useRef<null | number>(0);
	let { useMainScrollToBottom } = useMainScroll();
	min_article_id_ref.current = min_article_id;

	const { setCurrentLocation } = LocationState.useContainer();
	React.useLayoutEffect(() => {
		console.log(`開始載入 ${board_name}`);
		setMinArticleID(null);
		setIsEnd(false);
		fetchArticles(board_name, PAGE_SIZE, null, setMinArticleID).then(more_articles => {
			setArticles(more_articles);
		});
	}, [board_name]);

	React.useEffect(() => {
		setCurrentLocation(new BoardLocation(board_name));
	}, [setCurrentLocation, board_name]);

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

	useMainScrollToBottom(scrollHandler);

	return <div className="content">
		<div className="mainContent">
			{
				articles.map((article, pos) => (
					<div className={articleWrapper} key={`${article.meta.id}-${pos}`}>
						<ArticleCard article={article.meta} bonds={article.bonds} />
					</div>
				))
			}
		</div>
		{window.is_mobile ? <></> : <BoardSidebar board={props.board} />}
	</div>;
}
