import * as React from 'react';
import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { ArticleCard } from './article_card';
import { ArticleMeta } from '../ts/api/api_trait';
import { UserState } from './global_state/user';
import { toastErr } from './utils';

import style from '../css/pop_article_page.module.css';
import '../css/layout.css';

export function SubscribeArticlePage(): JSX.Element {
	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);
	const { user_state } = UserState.useContainer();

	React.useEffect(() => {
		fetchSubscribeArticles().then(more_articles => {
			try {
				setArticles(more_articles);
			} catch (err) {
				toastErr(err);
			}
		});
	}, [user_state.login]);

	return <div className={style.switchContent}>
		<div className="mainContent">
			<Articles articles={articles}/>
		</div>
	</div>;
}

function Articles(props: {articles: ArticleMeta[]}): JSX.Element {
	return <div>
		{props.articles.map((article, idx) => (
			<div className={style.articleWrapper} key={`article-${idx}`}>
				<ArticleCard article={article} />
			</div>
		))}
	</div>;
}

async function fetchSubscribeArticles(): Promise<ArticleMeta[]> {
	return unwrap_or(await API_FETCHER.articleQuery.getSubscribeArticle(10), []);
}