import * as React from 'react';
import { produce } from 'immer';
import { RouteComponentProps, Redirect } from 'react-router';
import { MainScrollState } from '../global_state/main_scroll';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleHeader, ArticleLine, ArticleFooter, SimpleArticleCard, SimpleArticleCardById, CommentCard } from '../article_card';
import '../../css/board_switch/article_page.css';
import { Article, ArticleMeta, Board } from '../../ts/api/api_trait';
import { parse_category, Field, Force } from 'force';
import { get_force, useForce } from '../../ts/cache';
import { EditorPanelState } from '../global_state/editor_panel';
import * as force_util from '../../ts/force_util';
import { isImageLink, isLink } from '../../ts/regex_util';
import { toastErr } from '../utils';

function BigReplyList(props: { article: Article }): JSX.Element {
	// TODO: 從上層傳遞
	const { article } = props;
	let [metas, setMetas] = React.useState<ArticleMeta[]>([]);
	let [expanded, setExpanded] = React.useState<Boolean>(true);

	React.useEffect(() => {
		get_force(article.meta.board_id)
		.then(force => {
			const big_members = force_util.get_big_members(force);
			return API_FETCHER.queryBonderMeta(article.meta.id, big_members);
		}).then(data => {
			setMetas(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [article.meta.board_id, article.meta.id]);

	return <div styleName="replyCardList">
		<div styleName="listTitle" onClick={() => setExpanded(!expanded)}>
			<span styleName="toggleButton"> {expanded ? '⯆' : '⯈'} </span>
			<span>{metas.length} 篇大回文</span>
		</div>
		<div>
			{
				expanded
					? metas.map(meta => <SimpleArticleCard key={meta.id} meta={meta} />)
					: null
			}
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

function Comments(props: { article: Article, board: Board }): JSX.Element {
	const { article, board } = props;
	let [small_articles, setSmallArticles] = React.useState<Article[]>([]);
	let [small_fields, setSmallFields] = React.useState<FieldPath[]>([]);
	let [expanded, setExpanded] = React.useState<Boolean>(true);

	const get_comment = ((): void => {
		get_force(article.meta.board_id)
		.then(force => {
			const small_members = force_util.get_small_members(force);
			let small_fields = get_bond_fields(force, article.meta.category_name).filter(fp => small_members.includes(fp.category));
			setSmallFields(small_fields);
			return API_FETCHER.queryBonder(article.meta.id, small_members);
		}).then(data => {
			setSmallArticles(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	});

	React.useEffect(get_comment, [article.meta.board_id, article.meta.id]);

	function CommentButtons(): JSX.Element {
		return <>{
			small_fields.map(fp => {
				const key = `${fp.category}#${fp.field}`;
				return <ReplyButton
					board={board}
					article={article}
					category_name={fp.category}
					field_name={fp.field}
					is_array={fp.is_array}
					key={key} />;
			})
		}</>;
	}
	return <div styleName="comments">
		<div styleName="listTitle" onClick={() => setExpanded(!expanded)}>
			<span styleName="toggleButton">{expanded ? '⯆' : '⯈'} </span>
			<span>{small_articles.length} 則留言</span>
		</div>
		<div styleName="contents">
			<div>
				{
					expanded
						? small_articles.map(article => <CommentCard key={article.meta.id} meta={article.meta} />)
						: null
				}
			</div>
			<div>
				<CommentButtons />
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

function ReplyButton(props: { board: Board, article: Article, category_name: string, field_name: string, is_array: boolean }): JSX.Element {
	const { board, article } = props;
	const { openEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const onClick = (): void => {
		if (editor_panel_data == null ||
			editor_panel_data.category == '') {
			setEditorPanelData({
				board,
				category: props.category_name,
				title: '',
				content: { [props.field_name]: props.is_array ? [`${article.meta.id}`] : `${article.meta.id}`}
			});
			openEditorPanel();
		} else if (editor_panel_data.board.id == board.id && editor_panel_data.category == props.category_name) {
			const next_state = produce(editor_panel_data, nxt => {
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
			setEditorPanelData(next_state);
			openEditorPanel();
		} else {
			toastErr('尚在編輯其他文章，請關閉後再點擊');
		}
	};
	return <button onClick={onClick}>
		{`${props.category_name}#${props.field_name}`}
	</button>;
}

function ArticleDisplayPage(props: { article: Article, board: Board }): JSX.Element {
	let { article, board } = props;

	let scrollHandler = React.useCallback(() => {}, []);
	let { useScrollToBottom } = MainScrollState.useContainer();
	useScrollToBottom(scrollHandler);

	const category_name = article.meta.category_name;


	function ReplyButtons(): JSX.Element {
		let [expanded, setExpanded] = React.useState<Boolean>(false);
		const force = useForce(board.id);
		let candidates: FieldPath[] = [];
		if (force) {
			candidates = get_bond_fields(force, category_name);
		}
		return <div>
			<button onClick={() => setExpanded(!expanded)}>鍵結到本文</button>
			<div styleName="offset">
				{
					expanded ?
					// XXX: 這個 key 可能會被惡意製造成重複的
						candidates.map(fp => {
							const key = `${fp.category}#${fp.field}`;
							return <ReplyButton
								board={board}
								article={article}
								category_name={fp.category}
								field_name={fp.field}
								is_array={fp.is_array}
								key={key} />;
						}) :
						<></>
				}
			</div>
		</div>;
	}
	return <div styleName="articlePage">
		<ArticleHeader
			user_name={article.meta.author_name}
			board_name={article.meta.board_name}
			date={new Date(article.meta.create_time)} />
		<ArticleLine
			id={article.meta.id}
			category_name={category_name}
			title={article.meta.title} />
		<ReplyButtons />
		<ArticleContent article={article} />
		<ArticleFooter />
		<BigReplyList article={article}/>
		<Comments article={article} board={board}/>
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
			return <ArticleDisplayPage article={article} board={props.board}/>;
		} else {
			return <Redirect to={`/app/b/${article.meta.board_name}/a/${article.meta.id}`} />;
		}
	} else {
		return <div>找不到文章QQ</div>;
	}
}