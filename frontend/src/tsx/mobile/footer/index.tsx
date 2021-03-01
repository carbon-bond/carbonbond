import * as React from 'react';
import { Link } from 'react-router-dom';
import '../../../css/mobile/footer.css';

export enum FooterState {
    Home,
    Notification,
};

function url(state: FooterState): string {
	switch (state) {
		case FooterState.Home:
			return '';
		case FooterState.Notification:
			return 'notification';
		default:
			throw `未知的 ${state}`;
	}
}

export function Footer(props: { cur_state: FooterState }): JSX.Element {
	return <div className="footer" styleName="footer">
		<IconBlock icon="🏠" state={FooterState.Home} {...props}/>
		<IconBlock icon="🔔" state={FooterState.Notification} {...props} />
	</div>;
}

function IconBlock(props: { icon: string, state: FooterState, cur_state: FooterState}): JSX.Element {
	return <div styleName="iconBlock">
		<Link to={`/app/${url(props.state)}`}>
			<div styleName="icon">
				{props.icon}
			</div>
		</Link>
	</div>;
}