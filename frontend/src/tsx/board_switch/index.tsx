import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { Category } from '../../ts/forum_util';

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

export type Board = {
	boardName: string
};

export type ArticleMeta = {
	id: string,
	title: string,
	categoryName: string,
	authorId: string,
	energy: number,
	createTime: number
};

export type Article = {
	id: string,
	title: string,
	authorId: string,
	raw_category: { body: string },
	category: Category,
	content: string[],
	energy: number,
	createTime: number
	board: Board
};

export function isMeta(a: Article | ArticleMeta): a is ArticleMeta {
	return !('content' in a);
}