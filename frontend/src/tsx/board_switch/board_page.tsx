import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { EditorPanelState, UserState } from '../global_state';

import '../../css/board_page.css';
import { getGraphQLClient } from '../../ts/api';
import { ArticleMeta } from '.';

const PAGE_SIZE: number = 10;

type Props = RouteComponentProps<{ board_name: string }>;

type ArticleList = {
	articleList: ArticleMeta[]
};

// TODO: Show fetching animation before data

function fetchArticles(board_name: string, page_size: number, offset: number): Promise<ArticleList> {
	const graphQLClient = getGraphQLClient();
	const query = `query {
		articleList(boardName: "${board_name}", pageSize: ${page_size}, offset: ${offset}) {
			id
			title
			categoryName
			authorId
			energy
			createTime
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
			openEditorPanel({ board_name });
		}
	}

	const [_articles, setArticles] = React.useState<ArticleMeta[]>([]);

	function appendArticles (newArticles: ArticleMeta[]): void {
		setArticles([..._articles, ...newArticles]);
	}

	React.useEffect(() => {
		fetchArticles(props.match.params.board_name, PAGE_SIZE, 0).then(articles => {
			console.log(articles);
			setArticles(articles.articleList);
		});
	}, [props.match.params.board_name]);

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

	return <div styleName="boardContent" onScroll={handleScoll}>
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
					<Link to={`/app/b/${board_name}/a/${article.id}`} key={idx}>
						<li styleName="articleTitle">
							<p>{article.id} - {article.title}</p>
						</li>
					</Link>
				))
			}
		</ul>
	</div>;
}