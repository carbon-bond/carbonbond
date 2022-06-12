import * as React from 'react';
import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { ArticleCard } from './article_card';
import { ArticleMetaWithBonds } from '../ts/api/api_trait';
import { UserState } from './global_state/user';
import { toastErr } from './utils';
import { LocationState, SimpleLocation } from './global_state/location';

import style from '../css/pop_article_page.module.css';
import '../css/layout.css';

export function SubscribeArticlePage(): JSX.Element {
	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);
	const { user_state } = UserState.useContainer();
	const { setCurrentLocation } = LocationState.useContainer();

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
		setCurrentLocation(new SimpleLocation('我的追蹤'));
	}, [user_state.login, setCurrentLocation]);

	return <div className="content">
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