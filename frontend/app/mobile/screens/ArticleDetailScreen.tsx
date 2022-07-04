import * as React from 'react';

import { Text, View } from '../components/Themed';

import { api_utils } from 'carbonbond-api/index';
const { unwrap } = api_utils;
import { API_FETCHER } from '../api';
import { BoardStackScreenProps } from '../types';
import { Article } from 'carbonbond-api/api_trait';

async function fetchArticle(article_id: number): Promise<Article> {
	// TODO toastErr when fail
	return unwrap(await API_FETCHER.articleQuery.queryArticle(article_id));
}

export function ArticleDetailScreen({route}: BoardStackScreenProps<'ArticleDetail'>): JSX.Element {
	let [article, setArticle] = React.useState<Article>();
	const { article_id } = route.params;
	React.useEffect(() => {
		fetchArticle(article_id).then(article => {
			setArticle(article);
		})
        .catch(err => console.warn(err));
	}, [article_id]);
	return (
		<View>
			<Text>{article?.content}</Text>
		</View>
	);
}
