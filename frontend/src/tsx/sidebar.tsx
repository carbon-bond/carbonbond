import * as React from 'react';
import '../css/sidebar.css';

function Sidebar(): JSX.Element {
	return (
		<>
			<div styleName="menubar">
				<div styleName="topSet">
					<div styleName="icon">🗐</div>
					<div styleName="icon">🔍</div>
					<div styleName="icon">🗨️</div>
					<div styleName="icon">🕭</div>
					<div styleName="icon">💑</div>
				</div>
				<div styleName="bottomSet">
					<div styleName="icon">🛍</div>
				</div>
			</div>
			<div styleName="sidebar"></div>
		</>
	);
}

export { Sidebar };
