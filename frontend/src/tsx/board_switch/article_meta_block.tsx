import * as React from 'react';
import { ArticleMeta, Article, isMeta } from '.';

export function ArticleMetaBlock(props: { article: ArticleMeta | Article }): JSX.Element {
	if (isMeta(props.article)) {
		let article = props.article;
		return <div>
			<h3>{article.categoryName}</h3>
			<h3>{article.title}</h3>
			<h3>{article.authorId}</h3>
		</div>;
	} else {
		let article = props.article;
		return <div>
			<h3>{article.category.name}</h3>
			<h3>{article.title}</h3>
			<h3>{article.authorId}</h3>
		</div>;
	}
}