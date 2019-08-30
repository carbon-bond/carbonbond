import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { BoardSidebar } from './board_sidebar';
import { Category } from '../../ts/forum_util';
import { GQL } from '../../ts/api';

export type Article = GQL.ArticleDetailQuery['article'];
export type ArticleMeta = GQL.ArticleMetaFragment;



export function BoardSwitch(): JSX.Element {
	return <>
		<div className="switchHeader">
			<Switch>
				<Route exact path="/app/b/:board_name" render={props =>
					<h1>{ props.match.params.board_name }</h1>
				} />
			</Switch>
		</div>
		<div className="switchContent">
			<div className="mainContent">
				<Switch>
					<Route exact path="/app/b/:board_name" render={props =>
						<BoardPage {...props} />
					} />
					<Route exact path="/app/b/:board_name/a/:article_id" render={props =>
						<ArticlePage {...props} />
					} />
					<Redirect to="/app" />
				</Switch>
			</div>
			<div className="rightSideBar">
				<Switch>
					<Route exact path="/app/b/:board_name" render={props =>
						<BoardSidebar {...props}/>
					} />
				</Switch>
			</div>
		</div>
	</>;
}

export type Board = {
	boardName: string
};
