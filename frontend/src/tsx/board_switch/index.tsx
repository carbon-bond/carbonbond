import * as React from 'react';
import {
	Link,
	Switch,
	Route,
	Redirect,
} from 'react-router-dom';

import { RouteComponentProps } from 'react-router';
import { BoardPage } from './board_page';
import { BoardCreator } from './board_creator';
import { ArticlePage } from './article_page';
import { ArticleSidebar, BoardSidebar } from './right_sidebar';
import { Board } from '../../ts/api/api_trait';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import { UserState } from '../global_state/user';
import { History } from 'history';

import '../../css/board_switch/board_page.css';
import { toastErr } from '../utils';
import { GraphView } from './graph_view';

function BoardSwitch(props: { board_name: string, board_type: string, hide_sidebar?: boolean, history: History }): JSX.Element {
	let board_name = props.board_name;
	let board_type = props.board_type;
	let [fetching, setFetching] = React.useState(true);
	let [board, setBoard] = React.useState<Board | null>(null);
	let [subscribe_count, setSubscribeCount] = React.useState(0);
	let hide_sidebar = props.hide_sidebar;
	React.useEffect(() => {
		setBoard(null); // 注意：這裡會導致切看板時畫面閃動，但如果拿掉它，就要留意看板頁「以為自己在前一個的看板」之問題
		setFetching(true);
		API_FETCHER.queryBoard(board_name, board_type).then(res => {
			try {
				let board = unwrap(res);
				setBoard(board);
				return API_FETCHER.querySubscribedUserCount(board.id);
			} catch (err) {
				return Promise.reject(err);
			}
		}).then(res => {
			setSubscribeCount(unwrap_or(res, 0));
		}).catch(err => {
			toastErr(err);
		}).finally(() => {
			setFetching(false);
		});
	}, [board_name, board_type]);
	if (!fetching && board == null) {
		return <EmptyBoard board_name={props.board_name} board_type={props.board_type} history={props.history} />;
	} else {
		return <BoardContent board={board} hide_sidebar={hide_sidebar} subscribe_count={subscribe_count} board_type={props.board_type} />;
	}
}

function BoardContent(props: { board: Board | null, hide_sidebar?: boolean, subscribe_count: number, board_type: string }): JSX.Element {
	const cur_board_type = props.board_type === '一般看板' ? 'b' : 'user_board';

	return props.board ? <div className="forumBody">
		<div className="switchHeader">
			<div styleName="boardHeader">
				<div>
					<div styleName="headerLeft">
						{
							props.board == null ? null : <>
								<div styleName="boardTitle">
									<Link to={`/app/${cur_board_type}/${props.board.board_name}`}>{props.board.board_name}</Link>
								</div>
								<div styleName="boardSubTitle">{props.board.title}</div>
							</>
						}
					</div>

					<div styleName="headerRight">
						{
							props.board == null ? null : <div styleName="dataBox">
								<div styleName="dataBoxItem">
									<div styleName="number">{props.subscribe_count}</div>
									<div styleName="text">追蹤人數</div>
								</div>
								<div styleName="dataBoxItem">
									<div styleName="number">{props.board.popularity}</div>
									<div styleName="text">在線人數</div>
								</div>
							</div>
						}
					</div>
				</div>
			</div>
		</div>
		{
			props.board == null ? null : <Switch>
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
				<Route render={() => <SwitchContent board={props.board!} hide_sidebar={props.hide_sidebar} board_type={props.board_type} />} />
			</Switch>
		}
	</div> : <div></div>;
}

function SwitchContent(props: { board: Board, hide_sidebar?: boolean, board_type: String }): JSX.Element {
	let board = props.board;
	const cur_board_type = props.board_type === '一般看板' ? 'b' : 'user_board';
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

type PersonalBoardProps = RouteComponentProps<{ profile_name: string }> & { hide_sidebar?: boolean };

export function PersonalBoard(props: PersonalBoardProps): JSX.Element {
	return <BoardSwitch board_name={props.match.params.profile_name}
		board_type={'個人看板'} hide_sidebar={props.hide_sidebar} history={props.history} />;
}

type GeneralBoardProps = RouteComponentProps<{ board_name: string }> & { hide_sidebar?: boolean };

export function GeneralBoard(props: GeneralBoardProps): JSX.Element {
	return <BoardSwitch board_name={props.match.params.board_name}
		board_type={'一般看板'} hide_sidebar={props.hide_sidebar} history={props.history} />;
}

export function EmptyBoard(props: { board_name: string, board_type: string, history: History }): JSX.Element {
	const { user_state } = UserState.useContainer();
	const [expand, setExpand] = React.useState<boolean>(false);

	function handleClick(): void {
		setExpand(!expand);
	}

	return <div>
		<div>查無此看板</div>
		{(user_state.login && props.board_type == '個人看板' && props.board_name == user_state.user_name) && <button onClick={() => handleClick()}>🔨&nbsp;創建個人看板</button>}
		<BoardCreator board_type={'個人看板'} party_id={-1} visible={expand} setVisible={setExpand} history={props.history} />
	</div>;
}