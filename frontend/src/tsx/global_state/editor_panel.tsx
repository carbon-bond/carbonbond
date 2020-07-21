import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { Board } from '../../ts/api/api_trait';

export type Transfuse = -1 | 0 | 1;
export type NewArticle = {
	board_name: string,
	title?: string,
};
export type EditorPanelData = {
	// FIXME: 只記名字的話，可能發生奇怪的錯誤，例如發文到一半看板改名字了
	board: Board,
	category: string,
	title: string,
	content: string[],
};

function useEditorPanelState(): {
	is_open: boolean,
	openEditorPanel: () => void,
	closeEditorPanel: () => void,
	editor_panel_data: EditorPanelData | null,
	setEditorPanelData: (data: EditorPanelData | null) => void,
	} {
	let [data, setData] = useState<EditorPanelData | null>(null);
	let [is_open, setOpen] = useState(false);

	function openEditorPanel(): void {
		setOpen(true);
	}
	function closeEditorPanel(): void {
		setOpen(false);
	}
	function setEditorPanelData(data: EditorPanelData | null): void {
		setData(data);
	}
	return {
		is_open,
		openEditorPanel,
		closeEditorPanel,
		editor_panel_data: data,
		setEditorPanelData,
	};
}

export const EditorPanelState = createContainer(useEditorPanelState);