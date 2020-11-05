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
import { BoardCacheState } from '../global_state/board_cache';

function getQueryOr(name: string, query: queryString.ParsedQuery, default_val: string): string {
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

type CategoryEntry = { name: string, board_name: string, id: number };

export function SearchPage(props: RouteComponentProps): JSX.Element {
	const { cur_board, setCurBoard } = BoardCacheState.useContainer();
	const used_board_value = useInputValue('');
	let search_board = used_board_value.input_props;
	let setSearchBoard = React.useCallback(used_board_value.setValue, []);
	let [urlBoard, setUrlBoard] = React.useState('');
	let [articles, setArticles] = React.useState(new Array<Article>());
	let [categories, setCategories] = React.useState(new Array<CategoryEntry>());
	React.useEffect(() => {
		let opt = queryString.parse(props.location.search);
		let query = (() => {
			try {
				let title = getQuery('title', opt);
				let board = getQueryOpt('board', opt);
				let author = getQueryOpt('author', opt);
				if (board) {
					setUrlBoard(board);
					setSearchBoard(board);
					setCurBoard(board);
				} else {
					setUrlBoard('');
					setSearchBoard('');
				}
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
				let articles = unwrap(res);
				let category_map: { [id: string]: CategoryEntry } = {};
				for (let article of articles) {
					category_map[article.meta.category_id] = {
						id: article.meta.category_id,
						name: article.meta.category_name,
						board_name: article.meta.board_name
					};
				}
				let categories = Object.keys(category_map).map(id => {
					return category_map[id];
				});
				setArticles(articles);
				setCategories(categories);
			} catch (e) {
				toast.error(e);
			}
		});
	}, [setCurBoard, props.location.search]);
	let opt = queryString.parse(props.location.search);
	const author = useInputValue(getQueryOr('author', opt, '')).input_props;

	function onSearch(): void {
		let opt = queryString.parse(props.location.search);
		if (author.value.length > 0) {
			opt.author = author.value;
		} else {
			delete opt.author;
		}
		if (search_board.value.length > 0) {
			opt.board = search_board.value;
		} else {
			delete opt.board;
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
				<label>看板</label><br/>
				<select {...search_board}>
					<option value="">全站搜尋</option>
					{
						(() => {
							if (cur_board) {
								return <option value={cur_board}>{cur_board}</option>;
							} else if (urlBoard) {
								return <option value={urlBoard}>{urlBoard}</option>;
							}
						})()
					}
				</select><br/>
				<label>分類</label><br/>
				<select>
					<option value={-1}>全部分類</option>
					{
						categories.map(category => {
							return <option value={category.id}>{category.board_name} - {category.name}</option>;
						})
					}

				</select><br/>
				<button onClick={onSearch}>送出</button>
			</div>
		</div>
	</div>;
}
