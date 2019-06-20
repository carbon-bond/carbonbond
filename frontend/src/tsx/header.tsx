import * as React from "react";
import "../css/header.css";

function Header(): JSX.Element {
	return (
		<div className="header" styleName="header">
			<div styleName="leftSet">
				<div styleName="carbonbond">
					<img src="/img/icon.png" alt="" />
					碳鍵
				</div>
				<div styleName="location">全站熱門</div>
			</div>
			<div styleName="middleSet">
				<input type="text" placeholder="🔍 搜尋全站" />
			</div>
			<div styleName="rightSet">
				<div styleName="icon">♡</div>
				<div styleName="icon">☠</div>
				<div styleName="icon">🗞️</div>
				<div styleName="userInfo">
					<div styleName="image">💂️</div>
					<div styleName="userName">金剛</div>
					<div styleName="energy">⚡ 275</div>
				</div>
			</div>
		</div>
	);
}

export { Header };