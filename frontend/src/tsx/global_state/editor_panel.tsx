import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { CategoryBody, fetchCategories, checkCanAttach, checkCanReply, getArticleCategory } from '../../ts/forum_util';
import { Article } from '../board_switch';

export type Transfuse = -1 | 0 | 1;
type Edge = { article_id: string, category: CategoryBody , transfuse: Transfuse };
export type NewArticleArgs = {
	board_name: string,
	category?: CategoryBody,
	title?: string,
	reply_to?: { article: Article, transfuse: Transfuse },
};
export type EditorPanelData = {
	// FIXME: 只記名字的話，可能發生奇怪的錯誤，例如發文到一半看板改名字了
	board_name: string,
	categories: CategoryBody[],
	cur_category: CategoryBody,
	title: string,
	edges: Edge[],
	content: string[],
	root_id?: string
};

function useEditorPanelState(): {
	open: boolean,
	openEditorPanel: (new_article_args?: NewArticleArgs) => Promise<void>,
	closeEditorPanel: () => void,
	editor_panel_data: EditorPanelData | null,
	setEditorPanelData: React.Dispatch<React.SetStateAction<EditorPanelData|null>>,
	addEdge: (article: Article, transfuse: Transfuse) => void
	} {
	let [data, setData] = useState<EditorPanelData | null>(null);
	let [open, setOpen] = useState(false);

	async function openEditorPanel(args?: NewArticleArgs): Promise<void> {
		if (args) {
			// 開新文來編輯
			if (data) {
				// TODO: 錯誤處理，編輯其它文章到一半試圖直接切換文章
				return;
			} else {
				let attached_to = args.reply_to ? [getArticleCategory(args.reply_to.article)] : [];
				let categories = await fetchCategories(args.board_name);
				let cur_category = (() => {
					if (args.category) {
						if (!checkCanAttach(args.category, attached_to)) {
							throw new Error('指定了一個無法選擇的分類');
						} else {
							return args.category;
						}
					} else {
						let list = categories.filter(c => checkCanAttach(c, attached_to));
						if (list.length == 0) {
							throw new Error('沒有任何分類適用');
						} else {
							return list[0];
						}
					}
				})();

				let edges: Edge[] = [];
				if (args.reply_to) {
					edges.push({
						article_id: args.reply_to.article.id,
						category: getArticleCategory(args.reply_to.article),
						transfuse: args.reply_to.transfuse
					});
				}

				setData({
					cur_category,
					categories,
					root_id: args.reply_to ? args.reply_to.article.rootId : undefined,
					edges,
					board_name: args.board_name,
					title: args.title || '',
					content: Array(cur_category.structure.length).fill('')
				});
			}
		} else if (!data) {
			// TODO: 錯誤處理，沒有任何資訊卻想打開編輯視窗
		}
		setOpen(true);
	}
	function closeEditorPanel(): void {
		setOpen(false);
	}
	function addEdge(article: Article, transfuse: Transfuse): void {
		if (data) {
			checkCanReply(data, article, transfuse);
			let new_data = { ...data };
			new_data.root_id = article.rootId;
			new_data.edges.push({
				article_id: article.id,
				category: getArticleCategory(article),
				transfuse
			});
			setData(new_data);
		}
	}
	function setEditorPanelData(
		arg: EditorPanelData | null | ((d: EditorPanelData | null) => EditorPanelData|null)
	): void {
		let new_data = (() => {
			if (typeof arg == 'function') {
				return arg(data);
			} else {
				return arg;
			}
		})();
		if (new_data && new_data.edges.length == 0) {
			new_data.root_id = undefined;
		}
		setData(new_data);
	}
	return {
		open,
		openEditorPanel,
		closeEditorPanel,
		editor_panel_data: data,
		setEditorPanelData,
		addEdge
	};
}

export const EditorPanelState = createContainer(useEditorPanelState);