import * as React from 'react';
import { SimpleArticleCard, SatelliteCard, BondCard } from './index';
import { ArticleMeta, Edge, Board, Article } from '../../ts/api/api_trait';
import style from '../../css/board_switch/bonder.module.css';
import * as force_util from '../../ts/force_util';
import { toastErr } from '../utils';
import produce from 'immer';
import { EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap } from '../../ts/api/api';

export function SatelliteCards(props: { article: ArticleMeta, expanded: boolean }): JSX.Element {
	let { article, expanded }= props;
	let [satellite_articles, setSatelliteArticles] = React.useState<[Edge, Article][]>([]);
	React.useEffect(() => {
		API_FETCHER.articleQuery.queryBonder(article.id, null, { WhiteList: [force_util.SATELLITE] }).then(data => {
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
		API_FETCHER.articleQuery.queryBonderMeta(article.id, null, { BlackList: [force_util.SATELLITE] }).then(data => {
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
				return <div key={meta.id}>
					<SimpleArticleCard key={meta.id} meta={meta}>
						<BondCard bond={bond} />
					</SimpleArticleCard>
				</div>;
			})
		}
	</>;
}

export function ReplyButtons(props: { board: Board, article: ArticleMeta }): JSX.Element {
	const { board } = props;
	const tags = board.force.suggested_tags;
	return <div className={style.replyButtons}>
		<span> 🙋️鍵結到本文 </span>
		{
			tags.map((tag) => {
				return <ReplyButton {...props} key={tag} tag={tag} />;
			})
		}
	</div>;
}

function ReplyButton(props: { tag: string, board: Board, article: ArticleMeta }): JSX.Element {
	const { tag, board, article } = props;
	const { openEditorPanel, setEditorPanelData, editor_panel_data } = EditorPanelState.useContainer();
	const onClick = (): void => {
		// 若原本編輯器沒資料或是沒設定分類
		// 先設定分類並根據分類初始化編輯器資料
		if (editor_panel_data && editor_panel_data.board.id != board.id) {
			toastErr('尚在編輯其他文章，請關閉後再點擊');
		} else {
			let data = editor_panel_data == null ?
				{
					board: props.board,
					category: '',
					anonymous: false,
					title: '',
					content: {},
					bonds: [],
				} :
				editor_panel_data;
			data = produce(data, nxt => {
				nxt.bonds.push({
					article,
					tag,
					energy: 0,
				});
			});
			setEditorPanelData(data);
			openEditorPanel();
		}
	};
	return <button onClick={onClick}> {tag} </button>;
}
