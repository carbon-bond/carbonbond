import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import { API_FETCHER, unwrap, map } from '../../ts/api/api';
import { ArticleCard } from '../article_card';
import { Article } from '../../ts/api/api_trait';
import { produce } from 'immer';

import '../../css/article_wrapper.css';
import '../../css/layout.css';
import { useInputValue } from '../utils';
import { BoardCacheState } from '../global_state/board_cache';
import { Category, parse_category } from 'force';

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
type SearchFields = { [name: string]: string | number };

export function SearchPage(props: RouteComponentProps): JSX.Element {
	const { cur_board, setCurBoard } = BoardCacheState.useContainer();
	let [cur_category, setCurCategory] = React.useState<number | null>(null);

	const used_board_value = useInputValue('');
	let search_board = used_board_value.input_props;
	let setSearchBoard = React.useCallback(used_board_value.setValue, []);

	let used_category_value = useInputValue('', onSearchCategoryChange);
	let search_category = used_category_value.input_props;
	let setSearchCategory = React.useCallback(used_category_value.setValue, []);

	let [search_fields, setSearchFields] = React.useState<SearchFields>({});

	let [url_board, setUrlBoard] = React.useState('');
	let [articles, setArticles] = React.useState(new Array<Article>());
	let [categories, setCategories] = React.useState(new Array<CategoryEntry>());

	function onSearchCategoryChange(category_id_str: string): void {
		if (category_id_str !== '') {
			let category_id = parseInt(category_id_str);
			setCurCategory(category_id);
		} else {
			setCurCategory(null);
		}
	}

	React.useEffect(() => {
		let opt = queryString.parse(props.location.search);
		let query = (() => {
			try {
				let title = getQuery('title', opt);
				let board = getQueryOpt('board', opt);
				let author = getQueryOpt('author', opt);
				let category = map(getQueryOpt('category', opt), parseInt);
				let fields = map(getQueryOpt('fields', opt), s => {
					let obj = JSON.parse(s);
					if (typeof obj == 'object' && !Array.isArray(obj)) {
						return JSON.stringify(obj);
					} else {
						throw `不合法的欄位值 ${s}`;
					}
				});
				if (typeof fields != 'string') {
					fields = '{}';
				}
				if (board) {
					setUrlBoard(board);
					setSearchBoard(board);
					setCurBoard(board);
				} else {
					setUrlBoard('');
					setSearchBoard('');
				}
				if (category) {
					setCurCategory(category);
					setSearchCategory(category.toString());
				} else {
					setCurCategory(null);
					setSearchCategory('');
				}
				return { title, board, author, category, fields };
			} catch (err) {
				toast.error(err);
				return err as string;
			}
		})();
		if (typeof query == 'string') {
			return;
		}
		API_FETCHER.searchArticle(query.author, query.board, query.category, query.fields, null, null, query.title).then(res => {
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
	}, [setCurBoard, setSearchBoard, setSearchCategory, props.location.search]);
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
		if (search_category.value.length > 0) {
			opt.category = search_category.value;
		} else {
			delete opt.category;
		}
		if (search_fields !== {}) {
			opt.fields = JSON.stringify(search_fields);
		} else {
			delete opt.fields;
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
							} else if (url_board) {
								return <option value={url_board}>{url_board}</option>;
							}
						})()
					}
				</select><br/>
				<label>分類</label><br/>
				<select {...search_category}>
					<option value="">全部分類</option>
					{
						categories.map(category => {
							return <option value={category.id} key={category.id}>
								{category.board_name} - {category.name}
							</option>;
						})
					}
				</select><br/>
				<CategoryBlock category_id={cur_category} inputs={search_fields} setInputs={t => setSearchFields(t)}/>
				<button onClick={onSearch}>送出</button>
			</div>
		</div>
	</div>;
}

type CategoryBlockProps = {
	category_id: number | null,
	inputs: SearchFields,
	setInputs: (inputs: SearchFields) => void
};
function CategoryBlock(props: CategoryBlockProps): JSX.Element {
	let { category_id, inputs }= props;
	let setInputs = React.useCallback(t => props.setInputs(t), []);
	let [category, setCategory] = React.useState<Category | null>(null);

	function setField(name: string, e: React.ChangeEvent<HTMLInputElement>): void {
		let new_inputs = produce(inputs, nxt => {
			nxt[name] = e.target.value;
		});
		setInputs(new_inputs);
	}

	React.useEffect(() => {
		if (typeof category_id != 'number') {
			setCategory(null);
			setInputs({});
		} else {
			API_FETCHER.queryCategoryById(category_id).then(res => {
				try {
					let category_src = unwrap(res);
					setCategory(parse_category(category_src));
					setInputs({});
				} catch (err) {
					toast.error(err);
				}
			});
		}
	}, [category_id, setInputs]);

	if (!category) {
		return <></>;
	} else {
		return <>
		{
			category.fields.map((field) => {
				// TODO: 以 datatype 決定輸入型式
				let name = field.name;
				return <>
					<div key={`${category_id}${name}`}>
						<label>{name}</label> <br />
						<input type="text" onChange={e => setField(name, e)} /> <br />
					</div>
				</>;
			})
		}
		</>;
	}
}