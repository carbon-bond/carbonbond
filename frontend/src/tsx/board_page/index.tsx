import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { EditorPanelState, UserState } from '../global_state';
import { fetchCategories } from '../forum_util';

import { getGraphQLClient } from '../api';

type Props = RouteComponentProps<{ board_name: string }>;

type Article = {
	id: String,
	title: String,
	categoryName: String,
	author_id: String,
};

type ArticleList = {
	articleList: Article[]
};

function fetchArticles(board_name: string, page_size: number, offset: number): Promise<ArticleList> {
	const graphQLClient = getGraphQLClient();
	const query = `query {
		articleList(boardName: "${board_name}", pageSize: ${page_size}, offset: ${offset}) {
			id
			title
			categoryName
			author_id
		}
	}`;
	return graphQLClient.request(query);
}

export function BoardPage(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel } = EditorPanelState.useContainer();
	let board_name = props.match.params.board_name;

	function onEditClick(): void {
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			fetchCategories(board_name, []).then(categories => {
				openEditorPanel({
					board_name,
					categories
				});
			});
		}
	}

	const [_articles, setArticles] = React.useState<Article[]>([]);
	React.useEffect(() => {
		fetchArticles(props.match.params.board_name, 10, 0).then(articles => {
			setArticles(articles.articleList);
		});
	}, []);

	return <div>
		<h1>{board_name}</h1>
		{
			(() => {
				if (user_state.login) {
					return <h5 onClick={() => onEditClick()}>發表文章</h5>;
				}
			})()
		}
	</div>;
}