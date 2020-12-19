import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import queryString from 'query-string';
import { API_FETCHER, unwrap, map, map_or_else } from '../../ts/api/api';
import { ArticleCard } from '../article_card';
import { ArticleMeta, HashMap, SearchField } from '../../ts/api/api_trait';
import { DualSlider } from '../components/dual_slider';
import { produce } from 'immer';

import '../../css/article_wrapper.css';
import '../../css/layout.css';
import { toastErr, useInputValue } from '../utils';
import { BoardCacheState } from '../global_state/board_cache';
import { Category, parse_category, DataType } from 'force';

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
type SearchFields = { [name: string]: SearchField };

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
	let [articles, setArticles] = React.useState(new Array<ArticleMeta>());
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
				function toDatetime(s: string | null): string | null {
					return s == null ? null : new Date(s) as unknown as string;
				}
				let title = getQuery('title', opt);
				let board = getQueryOpt('board', opt);
				let author = getQueryOpt('author', opt);
				let start_time = toDatetime(getQueryOpt('start_time', opt));
				let end_time = toDatetime(getQueryOpt('end_time', opt));
				let category = map(getQueryOpt('category', opt), parseInt);
				let fields: HashMap<string, SearchField> = map_or_else(getQueryOpt('fields', opt), s => {
					let obj = JSON.parse(s);
					if (typeof obj != 'object' || Array.isArray(obj)) {
						throw `不合法的欄位值 ${s}`;
					}
					return obj;
				}, () => {
					return {};
				});
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
				return { title, board, author, category, fields, start_time, end_time };
			} catch (err) {
				toastErr(err);
				return err as string;
			}
		})();
		if (typeof query == 'string') {
			return;
		}
		API_FETCHER.searchArticle(query.author, query.board, query.start_time, query.end_time, query.category, query.title, query.fields).then(res => {
			try {
				let articles = unwrap(res);
				let category_map: { [id: string]: CategoryEntry } = {};
				for (let article of articles) {
					category_map[article.category_id] = {
						id: article.category_id,
						name: article.category_name,
						board_name: article.board_name
					};
				}
				let categories = Object.keys(category_map).map(id => {
					return category_map[id];
				});
				setArticles(articles);
				setCategories(categories);
			} catch (e) {
				toastErr(e);
			}
		});
	}, [setCurBoard, setSearchBoard, setSearchCategory, props.location.search]);

	let opt = queryString.parse(props.location.search);
	const author = useInputValue(getQueryOr('author', opt, '')).input_props;
	const start_time = useInputValue(getQueryOr('start_time', opt, '')).input_props;
	const end_time = useInputValue(getQueryOr('end_time', opt, '')).input_props;

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

		if (start_time.value.length > 0) {
			opt.start_time = start_time.value;
		} else {
			delete opt.start_time;
		}
		if (end_time.value.length > 0) {
			opt.end_time = end_time.value;
		} else {
			delete opt.end_time;
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
                    		return <div styleName="articleWrapper" key={`article-${article.id}`}>
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

				<label>最早</label><br/>
				<input type="date" {...start_time}/><br/>
				<label>最晚</label><br/>
				<input type="date" {...end_time}/><br/>

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
				<CategoryBlock category_id={cur_category} inputs={search_fields}
					setInputs={React.useCallback(t => setSearchFields(t), [])} />
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
	let { category_id, inputs, setInputs } = props;
	let [category, setCategory] = React.useState<Category | null>(null);

	function setField(name: string, value: [number, number] | string): void {
		let new_inputs = produce(inputs, nxt => {
			if (typeof value == 'string') {
				nxt[name] = {String: value};
			} else {
				nxt[name] = {Range: value};
			}
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
					toastErr(err);
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
				let ty = extractFieldType(field.datatype);
				if (ty == Type.None) {
					return null;
				}
				let name = field.name;
				return <>
					<div key={`${category_id}${name}`}>
						<label>{name}</label> <br />
						{
							(() => {
								if (ty == Type.Number) {
									return <DualSlider
										range={[1, 20]}
										onChange={r => setField(name, r)}
										transform={n => Math.floor(n)}
									/>;
								} else {
									return <input type="text" onChange={
										e => setField(name, e.target.value)
									} />;
								}
							})()
						}
						<br />
					</div>
				</>;
			})
		}
		</>;
	}
}

enum Type { Text, Number, None };
function extractFieldType(ty: DataType): Type {
	if (ty.kind == 'single') {
		if (ty.t.kind == 'text') {
			return Type.Text;
		} else if (ty.t.kind == 'number') {
			return Type.Number;
		}
	}
	return Type.None;
}