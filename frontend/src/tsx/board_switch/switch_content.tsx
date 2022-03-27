import * as React from 'react';
import {
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { Board } from '../../ts/api/api_trait';

import '../../css/layout.css';
import { GraphView } from './graph_view';
import { KeepAlive } from 'react-activation';
import { createBrowserHistory } from 'history';

function BoardPageWrap(props: {board: Board}): JSX.Element {
	return <div className="boardSwitchContent">
		<BoardPage {...props} />
	</div>;
}

function ArticlePageWrap(props: {board: Board}): JSX.Element {
	return <div className="boardSwitchContent">
		<ArticlePage {...props} />
	</div>;
}

function GraphPage(): JSX.Element {
	return <div style={{ display: 'flex', flexDirection: 'row' }}>
		<div style={{ flex: 1 }}>
			<GraphView />
		</div>
	</div>;
}

export function SwitchContent(props: { board: Board }): JSX.Element {
	let history = createBrowserHistory();
	return <Routes>
		<Route path={'graph/:article_id'} element={<GraphPage />} />
		<Route path="" element={
			<KeepAlive
				name={history.location.key}
				id={history.location.key}
				children={<BoardPageWrap board={props.board} />} />
		} />
		<Route path="a/:article_id" element={<ArticlePageWrap board={props.board} />} />
		<Route path="*" element={<Navigate to="/app" />} />
	</Routes>;
}