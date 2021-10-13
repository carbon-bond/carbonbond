import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { Board } from '../../ts/api/api_trait';

export type EditorPanelData = {
	// FIXME: 只記名字的話，可能發生奇怪的錯誤，例如發文到一半看板改名字了
	draft_id?: number,
	board: Board,
	category?: string,
	title: string,
	anonymous: boolean,
	// eslint-disable-next-line
	content: { [index: string]: any },
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
	} {
	let [data, setData] = useState<EditorPanelData | null>(null);
	let [window_state, setWindowState] = useState(WindowState.Minimize);

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
	};
}

export const EditorPanelState = createContainer(useEditorPanelState);