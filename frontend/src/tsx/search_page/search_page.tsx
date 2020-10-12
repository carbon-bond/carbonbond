import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleCard } from '../article_card';
import { Article } from '../../ts/api/api_trait';

import '../../css/article_wrapper.css';
import '../../css/layout.css';
import { useInputValue } from '../utils';

function _getQueryOr(name: string, query: queryString.ParsedQuery, default_val: string): string {
	try {
		return getQuery(name, query);
	} catch (_) {
		return default_val;
	}
}

function getQueryOpt(name: string, query: queryString.ParsedQuery): string | null {
	try {
		return getQuery(name, query);
	} catch (_) {
		return null;
	}
}
function getQuery(name: string, query: queryString.ParsedQuery): string {
	let s = query[name];
	if (typeof s == 'string') {
		return s;
	}
	throw `錯誤的詢問字串 ${name} - ${s}`;
}

export function SearchPage(props: RouteComponentProps): JSX.Element {
	let [articles, setArticles] = React.useState(new Array<Article>());
	React.useEffect(() => {
		let opt = queryString.parse(props.location.search);
		let query = (() => {
			try {
				let title = getQuery('title', opt);
				let board = getQueryOpt('board', opt);
				let author = getQueryOpt('author', opt);
				return { title, board, author };
			} catch (err) {
				toast.error(err);
				return err as string;
			}
		})();
		if (typeof query == 'string') {
			return;
		}
		API_FETCHER.searchArticle(query.author, query.board, null, null, null, {}, query.title).then(res => {
			try {
				setArticles(unwrap(res));
			} catch (e) {
				toast.error(e);
			}
		});
	}, [props.location.search]);

	const author = useInputValue('').input_props;

	function onSearch(): void {
		let opt = queryString.parse(props.location.search);
		if (author.value.length > 0) {
			opt.author = author.value;
		} else {
			delete opt.author;
		}
		props.history.push(`/app/search?${queryString.stringify(opt)}`);
	}

	return <div className="forumBody">
		<div className="switchContent">
			<div className="mainContent">
                <>
                    {
                    	articles.map(article => {
                    		return <div styleName="articleWrapper" key={`article-${article.meta.id}`}>
                    			<ArticleCard article={article} />
                    		</div>;
                    	})
                    }
                </>

			</div>
			<div className="rightSideBar">
				<label>作者</label><br/>
				<input type="text" {...author}/><br/>
				<button onClick={onSearch}>送出</button>
			</div>
		</div>
	</div>;
}
