import * as React from "react";
import "../css/header.css";
// import { UserState } from "./global_state";

function Header(): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	// const { user_state } = UserState.useContainer();

	function Dropdown(): JSX.Element {
		if (extended) {
			return <div styleName="dropdown">
				<div styleName="triangle"> </div>
				<div styleName="features">
					<div styleName="feature">🏯 我的城堡</div>
					<div styleName="feature">🏆 榮耀／卷宗</div>
					<div styleName="feature">🏳 登出</div>
					<div styleName="feature">⚙ 設定</div>
				</div>
			</div>;
		} else {
			return <></>;
		}
	}
	function UserStatus(): JSX.Element {
		return (
			<div styleName="wrap">
				<div styleName="userInfo" onClick={() => setExtended(!extended)}>
					<div styleName="image">💂️</div>
					<div styleName="userName">金剛</div>
					<div styleName="energy">⚡ 275</div>
				</div>
				{ Dropdown() }
			</div>
		);
	}
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
				{ UserStatus() }
			</div>
		</div>
	);
}

export { Header };