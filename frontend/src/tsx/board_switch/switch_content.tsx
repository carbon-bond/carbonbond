
import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { ArticleSidebar, BoardSidebar } from './right_sidebar';
import { Board, BoardType } from '../../ts/api/api_trait';

import '../../css/board_switch/board_page.css';
import { GraphView } from './graph_view';

export function SwitchContent(props: { board: Board, hide_sidebar?: boolean, board_type: string }): JSX.Element {
	const cur_board_type = props.board_type === BoardType.General ? 'b' : 'user_board';
	return <Switch>
		<Route exact path={`/app/${cur_board_type}/:board_name/graph/:article_id`} render={x =>
			<div style={{ display: 'flex', flexDirection: 'row' }}>
				<div style={{ flex: 1 }}>
					<GraphView {...x} />
				</div>
				{
					props.hide_sidebar ? null : <div className="rightSideBar">
						<ArticleSidebar />
					</div>
				}
			</div>
		} />
		<Route render={() => <SwitchContentInner board={props.board!} hide_sidebar={props.hide_sidebar} board_type={props.board_type} />} />
	</Switch>;
}

function SwitchContentInner(props: { board: Board, hide_sidebar?: boolean, board_type: String }): JSX.Element {
	let board = props.board;
	const cur_board_type = props.board_type === BoardType.General ? 'b' : 'user_board';
	return <div className="switchContent">
		<div className="mainContent">
			<Switch>
				<Route exact path={`/app/${cur_board_type}/:board_name`} render={props =>
					<BoardPage {...props} board={board} />
				} />
				<Route exact path={`/app/${cur_board_type}/:board_name/a/:article_id`} render={props =>
					<ArticlePage {...props} board={board} />
				} />
				<Redirect to="/app" />
			</Switch>
		</div>
		{
			props.hide_sidebar ? null : <div className="rightSideBar">
				<Switch>
					<Route exact path={`/app/${cur_board_type}/:board_name`} render={props =>
						<BoardSidebar {...props} board={board} />
					} />
					<Route exact path={`/app/${cur_board_type}/:board_name/a/:article_id`} render={() =>
						<ArticleSidebar />
					} />
				</Switch>
			</div>
		}
	</div>;
}
