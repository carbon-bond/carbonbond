import * as React from 'react';
import { RouteComponentProps } from 'react-router';

type Props = RouteComponentProps<{ article_id?: string }>;

export function ArticlePage(props: Props): JSX.Element {
	let article_id = props.match.params.article_id;
	return <div>
		文章頁，id={article_id}
	</div>;
}