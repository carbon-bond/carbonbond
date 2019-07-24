import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { EditorPanelState, UserState } from '../global_state';
import { fetchCategories } from '../forum_util';

import '../../css/board_page.css';
import { getGraphQLClient } from '../api';

const PAGE_SIZE: number = 10;

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

// TODO: Show fetching animation before data

function fetchArticles(board_name: string, page_size: number, offset: number): Promise<ArticleList> {
	const graphQLClient = getGraphQLClient();
	const query = `query {
		articleList(boardName: "${board_name}", pageSize: ${page_size}, offset: ${offset}) {
			id
			title
			categoryName
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

	function appendArticles (newArticles: Article[]): void {
		setArticles([..._articles, ...newArticles]);
	}

	React.useEffect(() => {
		fetchArticles(props.match.params.board_name, PAGE_SIZE, 0).then(articles => {
			console.log(articles);
			setArticles(articles.articleList);
		});
	}, []);

	const handleScoll = (e: React.SyntheticEvent): void => {
		if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight) {
			console.log('Touch End');
			const length: number = _articles.length;
			fetchArticles(props.match.params.board_name, PAGE_SIZE, length).then(articles => {
				if (articles.articleList.length > 0) {
					console.log(articles);
					appendArticles(articles.articleList);
				}
			});
		}
	};

	return <div styleName="board-content" onScroll={handleScoll}>
		<h1>{board_name}</h1>
		{
			(() => {
				if (user_state.login) {
					return <h5 onClick={() => onEditClick()}>發表文章</h5>;
				}
			})()
		}

		<ul>
			{
				_articles.map((article, idx) => (
					<Link to="#" key={idx}>
						<li styleName="article-title">
							<p>{article.id} - {article.title}</p>
						</li>
					</Link>
				))
			}
		</ul>
	</div>;
}