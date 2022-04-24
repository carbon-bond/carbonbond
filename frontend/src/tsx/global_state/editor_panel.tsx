import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { Board, BondInfo } from '../../ts/api/api_trait';

export type EditorPanelData = {
	draft_id?: number,
	id?: number, // 文章 id ，文章已經存在，更新文章時會用到
	board: Board,
	category?: string,
	title: string,
	anonymous: boolean,
	content: { [index: string]: string },
	bonds: BondInfo[],
};

export enum WindowState {
	Minimize,
	Bottom,
	Expanded,
};

function useEditorPanelState(): {
	window_state: WindowState,
	expandEditorPanel: () => void,
	openEditorPanel: () => void,
	minimizeEditorPanel: () => void,
	editor_panel_data: EditorPanelData | null,
	setEditorPanelData: (data: EditorPanelData | null) => void,
	updated_article_id: number | null,
	setUpdatedArticleId: (data: number | null) => void,
	} {
	let [data, setData] = useState<EditorPanelData | null>(null);
	let [window_state, setWindowState] = useState(WindowState.Minimize);
	let [updated_article_id, setUpdatedArticleId] = useState<number | null>(null);

	function expandEditorPanel(): void {
		setWindowState(WindowState.Expanded);
	}
	function openEditorPanel(): void {
		setWindowState(WindowState.Bottom);
	}
	function minimizeEditorPanel(): void {
		setWindowState(WindowState.Minimize);
	}
	function setEditorPanelData(data: EditorPanelData | null): void {
		setData(data);
	}
	return {
		window_state,
		expandEditorPanel,
		openEditorPanel,
		minimizeEditorPanel,
		editor_panel_data: data,
		setEditorPanelData,
		updated_article_id,
		setUpdatedArticleId
	};
}

export const EditorPanelState = createContainer(useEditorPanelState);