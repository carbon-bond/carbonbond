import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';

export function BoardSwitch(): JSX.Element {
	return <>
		<div className='content'>
			<Switch>
				<Route exact path='/app/b/:board_name' render={props =>
					<BoardPage {...props} />
				} />
				<Route exact path='/app/b/:board_name/a/:article_id' render={props =>
					<ArticlePage {...props} />
				} />
				<Redirect to='/app' />
			</Switch>
		</div>
		<div className='rightSideBar'>
			右邊欄
		</div>
	</>;
}