import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { getGraphQLClient, extractErrMsg } from '../../ts/api';
import { Category } from '../../ts/forum_util';
import { toast } from 'react-toastify';
import '../../css/article_page.css';

type Props = RouteComponentProps<{ article_id?: string }>;

type Article = {
	title: string,
	authorId: string,
	raw_category: { body: string },
	category: Category,
	content: string[],
	energy: number,
	createTime: number
};

async function fetchArticleDetail(id: string): Promise<Article> {
	let client = getGraphQLClient();
	const query = `
			query ArticleDetail($id: ID!) {
				article(id: $id) {
					title, authorId, energy, createTime,
					content, raw_category:category { body }
				}
			}
		`;
	let res: { article: Article } = await client.request(query, { id });
	let article = res.article;
	article.category = JSON.parse(article.raw_category.body);
	return article;
}

export function ArticlePage(props: Props): JSX.Element {
	let article_id = props.match.params.article_id;
	let [fetching, setFetching] = React.useState(true);
	let [article, setArticle] = React.useState<Article | null>(null);

	React.useEffect(() => {
		if (typeof article_id == 'string') {
			fetchArticleDetail(article_id).then(a => {
				setArticle(a);
				setFetching(false);
			}).catch(err => {
				toast.error(extractErrMsg(err));
				setFetching(false);
			});
		} else {
			setFetching(false);
		}
	}, [article_id]);

	if (fetching) {
		return <div/>;
	} else if (article) {
		return <div styleName='articlePage'>
			<h3>{article.category.name}</h3>
			<h3>{article.title}</h3>
			<h3>{article.authorId}</h3>
			<div>
				{
					article.content.map((txt, i) => {
						return <div key={i}>{txt}</div>;
					})
				}
			</div>
		</div>;
	} else {
		return <div>找不到文章QQ</div>;
	}
}