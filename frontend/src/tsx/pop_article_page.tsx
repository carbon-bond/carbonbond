import * as React from 'react';
import { useTitle } from 'react-use';
import { API_FETCHER, unwrap_or } from '../ts/api/api';
import { ArticleCard } from './article_card';
import { ArticleMetaWithBonds } from '../ts/api/api_trait';
import { toastErr } from './utils';
import { LocationCacheState } from './global_state/location_cache';

import style from '../css/pop_article_page.module.css';
import '../css/layout.css';

export function PopArticlePage(): JSX.Element {
	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);
	const { setCurrentLocation } = LocationCacheState.useContainer();

	React.useEffect(() => {
		fetchPopArticles().then(more_articles => {
			more_articles.forEach(article_id => {
				console.log('PopArticlePage get ' + article_id);
			});
			try {
				setArticles(more_articles);
			} catch (err) {
				toastErr(err);
			}
		});
	}, []);

	React.useEffect(() => {
		setCurrentLocation({name: '全站熱門', is_article_page: false});
	}, [setCurrentLocation]);
	useTitle('全站熱門');

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

async function fetchPopArticles(): Promise<ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.articleQuery.searchPopArticle(10), []);
}