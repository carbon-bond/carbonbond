import * as React from 'react';
import { Link } from 'react-router-dom';

import '../../../css/mobile/menu.css';
import { UserState } from '../../global_state/user';

export function Menu(props: { onCoverClicked: () => void, userBlock: JSX.Element }): JSX.Element {
	let onCoverClicked = props.onCoverClicked;
	function Row<T>(props: { children: T, to?: string }): JSX.Element {
		if (props.to) {
			return <Link to={props.to} onClick={onCoverClicked}>
				<Row>{props.children}</Row>
			</Link>;
		}
		return <div styleName="row">
			<div styleName="space"/>
			{props.children}
			<div styleName="space"/>
		</div>;
	}
	const { user_state } = UserState.useContainer();
	return <>
        <div styleName="wrap">
        	<div styleName="cover" onClick={() => props.onCoverClicked()}/>
        	<div styleName="menu">
        		{
        			!user_state.login ? null : <>
                        <Row to={`/app/user/${user_state.user_name}`}>{props.userBlock}</Row>
                    </>
        		}
        		<Row>訂閱看板 ▼ </Row>
        		<Row>熱門看板 ▼ </Row>
        		{
        			!user_state.login ? null : <>
                        <Row to={`/app/user_board/${user_state.user_name}`}>我的個板</Row>
                    </>
        		}
        	</div>
        </div>
    </>;
}