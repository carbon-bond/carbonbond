import * as React from 'react';
import {
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { RouteComponentProps } from 'react-router';
import { BoardPage } from './board_page';
import { ArticlePage } from './article_page';
import { ArticleSidebar, BoardSidebar } from './right_sidebar';
import { Board } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap_or } from '../../ts/api/api';
import { toast } from 'react-toastify';

import '../../css/board_switch/board_page.css';

type Props = RouteComponentProps<{ board_name: string }>;

export function BoardSwitch(props: Props): JSX.Element {
	let board_name = props.match.params.board_name;
	let [fetching, setFetching] = React.useState(true);
	let [board, setBoard] = React.useState<Board | null>(null);
	React.useEffect(() => {
		API_FETCHER.queryBoard(board_name).then(board => {
			setBoard(unwrap_or(board, null));
			setFetching(false);
		}).catch(err => {
			toast.error(err);
			setFetching(false);
		});
	}, [board_name]);
	if (fetching) {
		return <div></div>;
	} else if (board == null) {
		return <div>查無此看板</div>;
	} else {
		return <div className="forumBody">
			<div className="switchHeader">
				<div styleName="boardHeader">
					<div>
						<div styleName="headerLeft">
							<div styleName="boardTitle">{board.board_name}</div>
							<div styleName="boardSubTitle">{board.title}</div>
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
			</div>
			<div className="switchContent">
				<div className="mainContent">
					<Switch>
						<Route exact path="/app/b/:board_name" render={props =>
							<BoardPage {...props} board={board!} />
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
							<BoardSidebar {...props} board={board!} />
						} />
						<Route exact path="/app/b/:board_name/a/:article_id" render={() =>
							<ArticleSidebar />
						} />
					</Switch>
				</div>
			</div>
		</div>;
	}
}