import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { MainScrollState } from '../global_state';

import '../../css/article_wrapper.css';
import '../../css/board_switch/board_page.css';
import { ajaxOperation } from '../../ts/api';
import { ArticleMeta } from '.';
import { ArticleCard } from '../article_card';

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
					<ArticleCard article={article} />
				</div>
			))
		}
	</>;
}
