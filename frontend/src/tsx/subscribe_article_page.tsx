import * as React from 'react';
import { useTitle } from 'react-use';
import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { ArticleCard } from './article_card';
import { ArticleMetaWithBonds } from '../ts/api/api_trait';
import { UserState } from './global_state/user';
import { toastErr } from './utils';
import { LocationCacheState } from './global_state/board_cache';

import style from '../css/pop_article_page.module.css';
import '../css/layout.css';

export function SubscribeArticlePage(): JSX.Element {
	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);
	const { user_state } = UserState.useContainer();
	const { setCurLocation } = LocationCacheState.useContainer();

	React.useEffect(() => {
		fetchSubscribeArticles().then(more_articles => {
			try {
				setArticles(more_articles);
			} catch (err) {
				toastErr(err);
			}
		});
	}, [user_state.login]);

	React.useEffect(() => {
		setCurLocation({name: '我的追蹤', is_board: false});
	}, [user_state.login, setCurLocation]);
	useTitle('我的追蹤');

	return <div className={style.switchContent}>
		<div className="mainContent">
			<Articles articles={articles}/>
		</div>
	</div>;
}

function Articles(props: {articles: ArticleMetaWithBonds[]}): JSX.Element {
	return <div>
		{props.articles.map((article, idx) => (
			<div className={style.articleWrapper} key={`article-${idx}`}>
				<ArticleCard article={article.meta} bonds={article.bonds} />
			</div>
		))}
	</div>;
}

async function fetchSubscribeArticles(): Promise<ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.articleQuery.getSubscribeArticle(10), []);
}