import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { ArticleSidebar, BoardSidebar } from './right_sidebar';
import { GQL } from '../../ts/api';

import '../../css/board_switch/board_page.css';

export type Article = GQL.ArticleDetailQuery['article'];
export type ArticleMeta = GQL.ArticleMetaFragment;

export function BoardSwitch(): JSX.Element {
	return <>
		<div className="switchHeader">
			<Switch>
				<Route path="/app/b/:board_name" render={props =>
					<div styleName="boardHeader">
						<div>
							<div styleName="headerLeft">
								<div styleName="boardTitle">{ props.match.params.board_name }</div>
								<div styleName="boardSubTitle">版主的話</div>
							</div>

							<div styleName="headerRight">
								<div styleName="dataBox">
									<div styleName="dataBoxItem">
										<div styleName="number">143.2 萬</div>
										<div styleName="text">追蹤人數</div>
									</div>
									<div styleName="dataBoxItem">
										<div styleName="number">800</div>
										<div styleName="text">在線人數</div>
									</div>
								</div>
							</div>
						</div>
					</div>
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
					<Route exact path="/app/b/:board_name/a/:article_id" render={() =>
						<ArticleSidebar  />
					} />
				</Switch>
			</div>
		</div>
	</>;
}

export type Board = {
	boardName: string
};
