import * as React from 'react';
import { Link } from 'react-router-dom';
import { Board } from '../../ts/api/api_trait';
import { useSubscribeBoard } from '../utils';

import style from '../../css/board/board_page.module.css';
import '../../css/layout.css';
import { UserState } from '../global_state/user';

export function BoardHeader(props: { board: Board, url: string, subscribe_count: number }): JSX.Element {
	return <div className="switchHeader">
		<div className={style.boardHeader}>
			<div>
				<div className={style.headerLeft}>
					<div className={style.boardTitle}>
						<Link to={props.url}>{props.board.board_name}</Link>
					</div>
					<div className={style.boardSubTitle}>{props.board.title}</div>
				</div>

				<div className={style.headerRight}>
					<SubscribeButton board={props.board}/>
				</div>
			</div>
		</div>
	</div>;
}

function SubscribeButton(props: { board: Board }): JSX.Element {
	let { has_subscribed, toggleSubscribe } = useSubscribeBoard(props.board);
	let { user_state } = UserState.useContainer();

	if (!user_state.login) {
		return <></>;
	}
	if (has_subscribed) {
		return <button onClick={toggleSubscribe}>取消訂閱</button>;
	} else {
		return <button onClick={toggleSubscribe}>訂閱看板</button>;
	}
}