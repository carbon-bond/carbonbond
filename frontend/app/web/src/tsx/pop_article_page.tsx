import * as React from 'react';
import { API_FETCHER, unwrap_or } from 'carbonbond-api/api_utils';
import { ArticleCard } from './article_card';
import { ArticleMetaWithBonds } from 'carbonbond-api/api_trait';
import { toastErr } from './utils';
import { LocationState, SimpleLocation } from './global_state/location';
import { TabPanelWithLink, TabPanelWithLinkItem } from './components/tab_panel';

import style from '../css/pop_article_page.module.css';
import '../css/layout.css';

function PopularArticlePageElement(): JSX.Element {
	const [articles, setArticles] = React.useState<ArticleMetaWithBonds[]>([]);
	const { setCurrentLocation } = LocationState.useContainer();
	const [fetching, setFetching] = React.useState<boolean>(true);

	React.useEffect(() => {
		fetchPopArticles().then(more_articles => {
			try {
				setArticles(more_articles);
			} catch (err) {
				toastErr(err);
			}
		}).finally(() => { setFetching(false); });
	}, []);

	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('全站熱門'));
	}, [setCurrentLocation]);

	return <div className="content">
		<div className="mainContent">
			{ fetching ? <></> : <Articles articles={articles}/> }
		</div>
	</div>;
}

function Articles(props: {articles: ArticleMetaWithBonds[]}): JSX.Element {
	return <div>
		{
			props.articles.length == 0
				? <div>暫無熱門文章</div>
				: props.articles.map((article) => (
					<div className={style.articleWrapper} key={article.meta.id}>
						<ArticleCard article={article.meta} bonds={article.bonds} />
					</div>
				))
		}
	</div>;
}

async function fetchPopArticles(): Promise<ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.articleQuery.searchPopArticle(30), []);
}

export function PopularArticlePage(): JSX.Element {
	return <TabPanelWithLink select_tab={0}>
		<TabPanelWithLinkItem is_disable={false} title="全站熱門"
			link="/app/pop_article"
			element={<PopularArticlePageElement />} />
		<TabPanelWithLinkItem is_disable={false} title="我的追蹤"
			link="/app/subscribe_article"
			element={<></>}/>
	</TabPanelWithLink>;
}
