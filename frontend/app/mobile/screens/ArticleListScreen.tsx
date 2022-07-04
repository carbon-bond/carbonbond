import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Text } from '../components/Themed';

import { api_trait, api_utils } from 'carbonbond-api/index';
const { unwrap_or } = api_utils;
import { API_FETCHER } from '../api';
import { BoardStackScreenProps } from '../types';

async function fetchArticleList(board_name: string): Promise<api_trait.ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.articleQuery.queryArticleList(20, null, null, board_name), []);
}

export function ArticleListScreen({navigation, route}: BoardStackScreenProps<'ArticleList'>): JSX.Element {
	let [article_list, setArticleList] = React.useState<api_trait.ArticleMetaWithBonds[]>([]);
	const { board_name } = route.params;
	React.useEffect(() => {
		fetchArticleList(board_name).then(article_list => {
			setArticleList(article_list);
		})
        .catch(err => console.warn(err));
	}, [board_name]);

	return (
		<ScrollView style={styles.container}>
			{
				article_list.map(article => {
					return <Text
						key={article.meta.id}
						style={styles.article_card}
						onPress={() => {
							navigation.push('ArticleDetail', {
								article_id: article.meta.id,
							});
						}}>
						{article.meta.title}
					</Text>;
				})
			}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	article_card: {
		borderWidth: 1,
		borderColor: '#ffffff',
		paddingHorizontal: 20,
		paddingVertical: 20,
		width: '100%',
	}
});
