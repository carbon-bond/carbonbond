import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Text } from '../components/Themed';

import { api_trait, api_utils } from 'carbonbond-api/index';
const { unwrap, unwrap_or } = api_utils;
import { API_FETCHER } from '../api';
import { ArticleStackParamList, ArticleStackScreenProps, BoardStackScreenProps } from '../types';
import { Article } from 'carbonbond-api/api_trait';

async function fetchArticleList(board_name: string): Promise<api_trait.ArticleMetaWithBonds[]> {
	return unwrap_or(await API_FETCHER.articleQuery.queryArticleList(20, null, null, board_name), []);
}

const ArticleStack = createNativeStackNavigator<ArticleStackParamList>();

export function ArticleListScreen(): JSX.Element {
	return (
		<ArticleStack.Navigator initialRouteName="ArticleListScrollView">
			<ArticleStack.Screen
                    name="ArticleListScrollView"
                    component={ArticleListScrollView}
                    options={() => ({
                        headerShown: false,
                    })}/>
			<ArticleStack.Screen
                    name="ArticleDetail"
                    component={ArticleDetail}
                    options={() => ({
                        headerShown: false,
                    })}/>
		</ArticleStack.Navigator>
	);
}

function ArticleListScrollView({navigation, route}: ArticleStackScreenProps<'ArticleListScrollView'>): JSX.Element {
	let [article_list, setArticleList] = React.useState<api_trait.ArticleMetaWithBonds[]>([]);
	const { board_name } = route.params;
	React.useEffect(() => {
		fetchArticleList(board_name).then(article_list => {
			setArticleList(article_list);
		})
    .catch(err => console.warn(err));
	}, []);

    return (
        <ScrollView style={styles.container}>
            {
                article_list.map(article => {
                    return <Text
                            key={article.meta.id}
                            style={styles.article_card}
                            onPress={() => {
                                navigation.navigate('ArticleDetail', {
                                    article_id: article.meta.id,
                                });
                            }}>
                        {article.meta.title}
                    </Text>;
                })
            }
        </ScrollView>
    )
}

async function fetchArticle(article_id: number): Promise<Article> {
    // TODO toastErr when fail
	return unwrap(await API_FETCHER.articleQuery.queryArticle(article_id));
}

function ArticleDetail({route}: ArticleStackScreenProps<'ArticleDetail'>): JSX.Element {
	let [article, setArticle] = React.useState<Article>();
	const { article_id } = route.params;
	React.useEffect(() => {
		fetchArticle(article_id).then(article => {
			setArticle(article);
		})
    .catch(err => console.warn(err));
	}, []);
    return (
        <View>
            <Text>{article?.content}</Text>
        </View>
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
