import * as React from 'react';
import { API_FETCHER, unwrap_or } from '../../ts/api/api';
import { useInputValue } from '../utils';
import { ArticleMeta } from '../../ts/api/api_trait';

function extract<T>(obj: { value: string } & T): string | null {
	let val = obj.value;
	if (val == '') {
		return null;
	} else {
		return val;
	}
}

function SearchBar(): JSX.Element {
	let author_name = useInputValue('', search).input_props;
	let board_name = useInputValue('', search).input_props;
	let category = useInputValue('', search).input_props;
	let title = useInputValue('', search).input_props;

	let [articles, setArticles] = React.useState(new Array<ArticleMeta>());

	function search(): void {
		API_FETCHER.searchArticle(
			extract(author_name), board_name.value, extract(category),
			null, null, {}, extract(title)
		).then(articles => {
			setArticles(unwrap_or(articles, []));
		});
	}

	return <>
        <input type="text" placeholder="看板名稱 TODO: 幫用戶填" {...board_name} />
        <input type="text" placeholder="標題" {...title} autoFocus />
        <input type="text" placeholder="作者名稱" {...author_name} />
        <input type="text" placeholder="分類" {...category} />
        <hr />
        {
        	articles.map(article => {
        		return <div key={article.id}>{JSON.stringify(article)}</div>;
        	})
        }
    </>;
}
export { SearchBar };