import * as React from 'react';
import { produce } from 'immer';
import { RouteComponentProps, Redirect } from 'react-router';
import { MainScrollState } from '../global_state/main_scroll';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, SimpleArticleCard, BondCard, SimpleArticleCardById, SatelliteCard } from '../article_card';
import '../../css/board_switch/article_page.css';
import { Article, ArticleMeta, Board, Edge } from '../../ts/api/api_trait';
import { parse_category, Field, Force, Category } from 'force';
import { get_force, useForce } from '../../ts/cache';
import { EditorPanelState } from '../global_state/editor_panel';
import * as force_util from '../../ts/force_util';
import { isImageLink, isLink } from '../../ts/regex_util';
import { toastErr } from '../utils';

function ReplyList(props: { article: Article }): JSX.Element {
	// TODO: 從上層傳遞
	const { article } = props;
	let [bonders, setBonders] = React.useState<[Edge, ArticleMeta][]>([]);
	let [expanded, setExpanded] = React.useState<boolean>(true);

	React.useEffect(() => {
		API_FETCHER.queryBonderMeta(article.meta.id, null, { BlackList: [force_util.SATELLITE] }).then(data => {
			setBonders(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [article.meta.board_id, article.meta.id]);

	function BonderCards(props: { bonders: [Edge, ArticleMeta][], expanded: boolean }): JSX.Element {
		if (expanded) {
			return <></>;
		}
		return <>
			{
				props.bonders.map(([bond, meta]) => {
					return <div>
						<BondCard bond={bond}/>
						<SimpleArticleCard key={meta.id} meta={meta} />
					</div>;
				})
			}
		</>;
	}

	return <div styleName="replyCardList">
		<div styleName="listTitle" onClick={() => setExpanded(!expanded)}>
			<span styleName="toggleButton"> {expanded ? '⯆' : '⯈'} </span>
			<span>{bonders.length} 篇回文</span>
		</div>
		<div>
			<BonderCards expanded={expanded} bonders={bonders} />
		</div>
	</div> ;
}

type FieldPath = {
	category: string,
	field: string,
	is_array: boolean,
};

function get_bond_fields(force: Force, category_name: string): FieldPath[] {
	let candidates: FieldPath[] = [];
	for (let [_, category] of force.categories) {
		for (let field of category.fields) {
			if (field.datatype.t.kind == 'bond' || field.datatype.t.kind == 'tagged_bond') {
				let bondee = field.datatype.t.bondee;
				if (bondee.kind == 'all'
					|| bondee.category.includes(category_name)
					|| bondee.family.filter(f => force.families.get(f)!.includes(category_name)).length > 0) {
					candidates.push({ category: category.name, field: field.name, is_array: field.datatype.kind == 'array'});
				}
			}
		}
	}
	return candidates;
}

function Satellites(props: { article: Article, board: Board }): JSX.Element {
	const { article, board } = props;
	let [satellite_articles, setSatelliteArticles] = React.useState<[Edge, Article][]>([]);
	let [satellite_fields, setSatelliteFields] = React.useState<FieldPath[]>([]);
	let [expanded, setExpanded] = React.useState<boolean>(true);

	const get_satellite = ((): void => {
		get_force(article.meta.board_id)
		.then(force => {
			const satellite_members = force_util.get_satellite_members(force);
			let satellite_fields = get_bond_fields(force, article.meta.category_name).filter(fp => satellite_members.includes(fp.category));
			setSatelliteFields(satellite_fields);
		});
		API_FETCHER.queryBonder(article.meta.id, null, { WhiteList: [force_util.SATELLITE] }).then(data => {
			setSatelliteArticles(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	});

	React.useEffect(get_satellite, [article.meta.board_id, article.meta.id]);

	function SatelliteButtons(): JSX.Element {
		let force = useForce(board.id);
		if (force) {
			return <ReplyArea force={force} candidates={satellite_fields} article={article} board={board}/>;
		} else {
			return <></>;
		}
	}
	return <div styleName="satellites">
		<div styleName="listTitle" onClick={() => setExpanded(!expanded)}>
			<span styleName="toggleButton">{expanded ? '⯆' : '⯈'} </span>
			<span>{satellite_articles.length} 則衛星</span>
		</div>
		<div styleName="contents">
			<div>
				{
					expanded
						? satellite_articles.map(([bond, article]) => <SatelliteCard key={article.meta.id} meta={article.meta} bond={bond}/>)
						: null
				}
			</div>
			<div>
				<SatelliteButtons />
			</div>
		</div>
	</div>;
}

export function ShowText(props: { text: string }): JSX.Element {
	let key = 0;
	return <>{
		props.text.split('\n').map(line => {
			if (line.length == 0) {
				// 換行
				return <br key={key++} />;
			} else if (isImageLink(line.trim())) {
				return <>
					<p key={key++}>
						<a target="_blank" href={line}>
							{line}
							<img key={key++} src={line.trim()} width="100%" alt="圖片"/>
						</a>
					</p>
				</>;
			} else if (isLink(line.trim())) {
				return <p key={key++}>
					<a target="_blank" href={line}>{line}</a>
				</p>;
			} else {
				return <p key={key++}>{line}</p>;
			}
		})
	}
	</>;
}

// eslint-disable-next-line
function ShowSingleField(props: { field: Field, value: any }): JSX.Element {
	const { field, value } = props;
	if (field.datatype.t.kind == 'bond') {
		return <div styleName="cardWrap">
			<SimpleArticleCardById article_id={value} />
		</div>;
	} else {
		return <ShowText text={`${value}`} />;
	}
}

// eslint-disable-next-line
function ShowArrayField(props: { field: Field, value: any[] }): JSX.Element {
	const ret = [];
	for (let i = 0; i < props.value.length; i++) {
		if (i > 0) {
			ret.push(<hr />);
		}
		ret.push(<ShowSingleField field={props.field} value={props.value[i]} />);
	}
	return <>{ret}</>;
}

function ArticleContent(props: { article: Article }): JSX.Element {
	const article = props.article;
	const category = parse_category(article.meta.category_source);
	const content = JSON.parse(article.content);

	return <div styleName="articleContent">
		{
			category.fields.map(field =>
				<div styleName="field" key={field.name}>
					<div styleName="fieldName">{field.name}：</div>
					{
						(() => {
							const value = content[field.name];
							if (field.datatype.kind == 'array') {
								// @ts-ignore
								return <ShowArrayField field={field} value={value} />;
							} else {
								return <ShowSingleField field={field} value={value} />;
							}
						})()
					}
				</div>
			)
		}
	</div>;
}

function ReplyButton(props: { hide_field?: boolean, board: Board, article: Article, category: Category, field_name: string, is_array: boolean }): JSX.Element {
	const { board, article } = props;
	const { openEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const onClick = (): void => {
		// 若原本編輯器沒資料或是沒設定分類
		// 先設定分類並根據分類初始化編輯器資料
		if (editor_panel_data && (editor_panel_data.board.id != board.id || editor_panel_data.category != props.category.name)) {
			toastErr('尚在編輯其他文章，請關閉後再點擊');
		} else {
			let data = editor_panel_data == null ?
				{
					board: props.board,
					category: '',
					title: '',
					content: {},
				} :
				editor_panel_data;
			data = produce(data, nxt => {
				if (nxt.category == '') {
					nxt.category = props.category.name;
					nxt.content = force_util.new_content(props.category);
				}
			});
			data = produce(data, nxt => {
				if (props.is_array) {
					if (nxt.content[props.field_name] instanceof Array) {
						(nxt.content[props.field_name] as string[]).push(`${article.meta.id}`);
					} else {
						nxt.content[props.field_name] = [`${article.meta.id}`];
					}
				} else {
					nxt.content[props.field_name] = `${article.meta.id}`;
				}
			});
			setEditorPanelData(data);
			openEditorPanel();
		}
	};
	return <button onClick={onClick}>
		{props.hide_field ? props.category.name : `${props.category.name}#${props.field_name}`}
	</button>;
}

function ReplyArea(props: { force: Force, candidates: FieldPath[], board: Board, article: Article }): JSX.Element {
	type Candidate = { field_path: FieldPath, hide_field: boolean };
	let { board, article, force } = props;
	let candidates = [...props.candidates];
	// XXX: 要不要直接將同個分類收合？
	const MAX_DISPLAY = 5;
	function collect(candidates: FieldPath[]): Candidate[] {
		let map: { [category: string]: number } = {};
		for (let c of candidates) {
			if (!(c.category in map)) {
				map[c.category] = 0;
			}
			map[c.category]++;
		}
		let ret = new Array<Candidate>();
		for (let candidate of candidates) {
			let hide_field = map[candidate.category] == 1;
			ret.push({ field_path: candidate, hide_field });
		}
		return ret;
	}
	let showing = collect(candidates.splice(0, MAX_DISPLAY));
	let hiding = collect(candidates);
	let [expanded, setExpanded] = React.useState<boolean>(false);
	function Expander(): JSX.Element {
		if (Object.keys(hiding).length == 0) {
			return <></>;
		} else if (expanded) {
			return <button onClick={() => setExpanded(false)}>-顯示較少</button>;
		} else {
			return <button onClick={() => setExpanded(true)}>+顯示更多</button>;
		}
	}
	function ReplyList(props: { candidates: Candidate[] }): JSX.Element {
		return <>
			{
				// XXX: 這個 key 可能會被惡意製造成重複的
				props.candidates.map(t => {
					let fp = t.field_path;
					let hide_field = t.hide_field;
					let category = force.categories.get(fp.category)!;
					const key = `${fp.category}#${fp.field}`;
					return <ReplyButton
						board={board}
						article={article}
						category={category}
						field_name={fp.field}
						is_array={fp.is_array}
						hide_field={hide_field}
						key={key} />;
				})}
		</>;
	}
	return <div>
		<ReplyList candidates={showing} />
		<Expander />
		{
			expanded ? <span><br/><ReplyList candidates={hiding} /></span> : <></>
		}
	</div>;
}

function ArticleDisplayPage(props: { article: Article, board: Board }): JSX.Element {
	let { article, board } = props;

	let scrollHandler = React.useCallback(() => { }, []);
	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	const category_name = article.meta.category_name;

	function ReplyButtons(): JSX.Element {
		const force = useForce(board.id);
		let candidates: FieldPath[] = [];
		if (force) {
			candidates = get_bond_fields(force, category_name);
		}
		return <div>
			<div> 🙋️鍵結到本文 </div>
			{
				force ?
					<div styleName="offset">
						<ReplyArea force={force} candidates={candidates} article={article} board={board} />
					</div> :
					<></>
			}
		</div>;
	}
	return <div styleName="articlePage">
		<ArticleHeader
			user_name={article.meta.author_name}
			board_name={article.meta.board_name}
			date={new Date(article.meta.create_time)} />
		<ArticleLine
			board_name={article.meta.board_name}
			id={article.meta.id}
			category_name={category_name}
			title={article.meta.title} />
		<ReplyButtons />
		<ArticleContent article={article} />
		<ArticleFooter  article={article.meta}/>
		<ReplyList article={article} />
		<Satellites article={article} board={board} />
	</div>;
}

type Props = RouteComponentProps<{ article_id?: string, board_name?: string }> & {
	board: Board
};

export function ArticlePage(props: Props): JSX.Element {
	let article_id = parseInt(props.match.params.article_id!);
	let board_name = props.match.params.board_name;
	let [fetching, setFetching] = React.useState(true);
	let [article, setArticle] = React.useState<Article | null>(null);

	React.useEffect(() => {
		API_FETCHER.queryArticle(article_id).then(data => {
			setArticle(unwrap(data));
			setFetching(false);
		}).catch(err => {
			toastErr(err);
			setFetching(false);
		});
	}, [article_id, board_name, props.history]);

	if (fetching) {
		return <></>;
	} else if (article) {
		if (board_name) {
			return <ArticleDisplayPage article={article} board={props.board} />;
		} else {
			return <Redirect to={`/app/b/${article.meta.board_name}/a/${article.meta.id}`} />;
		}
	} else {
		return <div>找不到文章QQ</div>;
	}
}