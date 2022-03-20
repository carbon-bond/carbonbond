import * as React from 'react';
import {
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { ArticleSidebar, BoardSidebar } from './right_sidebar';
import { Board } from '../../ts/api/api_trait';

import '../../css/layout.css';
import { GraphView } from './graph_view';
import KeepAlive from 'react-activation';

function GraphPage(props: { hide_sidebar?: boolean }): JSX.Element {
	return <div style={{ display: 'flex', flexDirection: 'row' }}>
		<div style={{ flex: 1 }}>
			<GraphView />
		</div>
		{
			props.hide_sidebar ?
				<></> :
				<div className="rightSideBar">
					<ArticleSidebar />
				</div>
		}
	</div>;
}

export function SwitchContent(props: { board: Board, hide_sidebar?: boolean }): JSX.Element {
	return <Routes>
		<Route path={'graph/:article_id'} element={<GraphPage />} />
		<Route path="*" element={ <SwitchContentInner board={props.board!} hide_sidebar={props.hide_sidebar} />} />
	</Routes>;
}

function SwitchContentInner(props: { board: Board, hide_sidebar?: boolean }): JSX.Element {
	let board = props.board;
	return <div className="boardSwitchContent">
		<div className="mainContent">
			<Routes>
				<Route path="" element={ <KeepAlive id={`${board.board_type}/${board.board_name}`} children={<BoardPage board={board} />} />} />
				<Route path="a/:article_id" element={ <ArticlePage board={board} /> } />
				<Route path="*" element={<Navigate to="/app" />} />
			</Routes>
		</div>
		{
			props.hide_sidebar ? null : <div className="rightSideBar">
				<Routes>
					<Route path="" element={<BoardSidebar board={board} /> } />
					<Route path="a/:article_id" element={<ArticleSidebar />} />
					<Route path="*" element={<Navigate to="/app" />} />
				</Routes>
			</div>
		}
	</div>;
}
