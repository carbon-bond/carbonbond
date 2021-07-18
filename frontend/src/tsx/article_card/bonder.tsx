import * as React from 'react';
import { SimpleArticleCard, BondCard, SatelliteCard } from './index';
import { ArticleMeta, Edge, Board, Article } from '../../ts/api/api_trait';
import { Force, Category } from 'force';
import '../../css/board_switch/article_card.css';
import { get_force, useForce } from '../../ts/cache';
import * as force_util from '../../ts/force_util';
import { toastErr } from '../utils';
import produce from 'immer';
import { EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap } from '../../ts/api/api';

export function SatelliteCards(props: { article: ArticleMeta, expanded: boolean }): JSX.Element {
	let { article, expanded }= props;
	let [satellite_articles, setSatelliteArticles] = React.useState<[Edge, Article][]>([]);
	React.useEffect(() => {
		API_FETCHER.queryBonder(article.id, null, { WhiteList: [force_util.SATELLITE] }).then(data => {
			setSatelliteArticles(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [article.id]);
	if (!expanded) {
		return <></>;
	}
	return <>
		{
			satellite_articles.map(([bond, article]) => {
				return <SatelliteCard key={article.meta.id} meta={article.meta} bond={bond} />;
			})
		}
	</>;
}

export function BonderCards(props: { article: ArticleMeta, expanded: boolean }): JSX.Element {
	let { article, expanded } = props;
	let [bonders, setBonders] = React.useState<[Edge, ArticleMeta][]>([]);
	React.useEffect(() => {
		API_FETCHER.queryBonderMeta(article.id, null, { BlackList: [force_util.SATELLITE] }).then(data => {
			setBonders(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [article.id]);
	if (!expanded) {
		return <></>;
	}
	return <>
        {
        	bonders.map(([bond, meta]) => {
        		return <div>
        			<BondCard bond={bond} />
        			<SimpleArticleCard key={meta.id} meta={meta} />
        		</div>;
        	})
        }
    </>;
}

export function ReplyButtons(props: { board: Board, article: ArticleMeta }): JSX.Element {
	const { article, board } = props;
	const force = useForce(board.id);
	let candidates: FieldPath[] = [];
	if (force) {
		candidates = get_bond_fields(force, article.category_name);
	}
	return <div>
		<div> 🙋️鍵結到本文 </div>
		{
			force ?
				<div className="offset">
					<ReplyArea force={force} candidates={candidates} article={article} board={board} />
				</div> :
				<></>
		}
	</div>;
}

type FieldPath = {
	category: string,
	field: string,
	is_array: boolean,
};

function ReplyArea(props: { force: Force, candidates: FieldPath[], board: Board, article: ArticleMeta }): JSX.Element {
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

function get_bond_fields(force: Force, category_name: string): FieldPath[] {
	let candidates: FieldPath[] = [];
	for (let [_, category] of force.categories) {
		for (let field of category.fields) {
			if (field.datatype.t.kind == 'bond') {
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

function ReplyButton(props: { hide_field?: boolean, board: Board, article: ArticleMeta, category: Category, field_name: string, is_array: boolean }): JSX.Element {
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
						(nxt.content[props.field_name] as string[]).push(`${article.id}`);
					} else {
						nxt.content[props.field_name] = [`${article.id}`];
					}
				} else {
					nxt.content[props.field_name] = `${article.id}`;
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

export function SatelliteButtons(props: { article: ArticleMeta, board: Board }): JSX.Element {
	let { board, article } = props;
	let force = useForce(article.board_id);
	let [satellite_fields, setSatelliteFields] = React.useState<FieldPath[]>([]);
	React.useEffect(() => {
		get_force(article.board_id)
			.then(force => {
				const satellite_members = force_util.get_satellite_members(force);
				let satellite_fields = get_bond_fields(force, article.category_name).filter(fp => satellite_members.includes(fp.category));
				setSatelliteFields(satellite_fields);
			});
	}, [article.board_id, article.category_name]);

	if (force) {
		return <ReplyArea force={force} candidates={satellite_fields} article={article} board={board} />;
	} else {
		return <></>;
	}
}