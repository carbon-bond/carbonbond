import * as React from 'react';
import { SimpleArticleCard, BondCard } from './index';
import { ArticleMeta, Edge, Board } from '../../ts/api/api_trait';
import style from '../../css/board/bonder.module.css';
import { toastErr } from '../utils';
import produce from 'immer';
import { EditorPanelState } from '../global_state/editor_panel';
import { API_FETCHER, unwrap } from '../../ts/api/api';

export function BonderCards(props: { article_id: number }): JSX.Element {
	let [bonders, setBonders] = React.useState<[Edge, ArticleMeta][]>([]);
	React.useEffect(() => {
		API_FETCHER.articleQuery.queryBonderMeta(props.article_id, null).then(data => {
			setBonders(unwrap(data));
		}).catch(err => {
			toastErr(err);
		});
	}, [props.article_id]);
	return <div>
		{
			bonders.map(([bond, meta]) => {
				return <div key={meta.id}>
					<SimpleArticleCard key={meta.id} meta={meta}>
						<BondCard bond={bond} />
					</SimpleArticleCard>
				</div>;
			})
		}
	</div>;
}

export function ReplyButtons(props: { board: Board, article: ArticleMeta }): JSX.Element {
	const { board } = props;
	const tags = board.force.suggested_tags;
	return <div className={style.replyButtons}>
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
			toastErr('尚在編輯其他文章，請關閉當前編輯器後再重新點擊');
		} else {
			let data = editor_panel_data == null ?
				{
					board: props.board,
					category_name: '',
					anonymous: false,
					title: '',
					value: {
						content: {},
						fields: [],
					},
					bonds: [],
				} :
				editor_panel_data;
			data = produce(data, nxt => {
				nxt.bonds.push({
					article_meta: article,
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
