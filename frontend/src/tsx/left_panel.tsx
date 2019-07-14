import * as React from 'react';
import { ChatBar } from './chatbar';
import '../css/sidebar.css';

enum Option {
	Browse,
	Search,
	Chat,
	DiscoverFriend,
	Rocket,
	PluginStore,
	None            // 側欄關閉
}

function PanelMain(option: Option): JSX.Element {
	switch (option) {
		case Option.Browse:
			return <div styleName="sidebar">瀏覽</div>;
		case Option.Search:
			return <div styleName="sidebar">搜尋</div>;
		case Option.Chat:
			return <div styleName="sidebar"><ChatBar /></div>;
		case Option.DiscoverFriend:
			return <div styleName="sidebar">交友</div>;
		case Option.Rocket:
			return <div styleName="sidebar">火箭</div>;
		case Option.PluginStore:
			return <div styleName="sidebar">市集</div>;
		case Option.None:
			return <></>;
	}
}

function LeftPanel(): JSX.Element {
	const [option, setOption] = React.useState(Option.Browse);

	function toggleOption(op: Option): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
		return () => {
			if (op == option) {
				setOption(Option.None);
			} else {
				setOption(op);
			}
		};
	}

	return (
		<>
			<div styleName="menubar">
				<div styleName="topSet">
					<div styleName="icon" onClick={toggleOption(Option.Browse)}>🗐</div>
					<div styleName="icon" onClick={toggleOption(Option.Search)}>🔍</div>
					<div styleName="icon" onClick={toggleOption(Option.Chat)}>🗨️</div>
					<div styleName="icon" onClick={toggleOption(Option.DiscoverFriend)}>💑</div>
					<div styleName="icon" onClick={toggleOption(Option.Rocket)}>🚀</div>
				</div>
				<div styleName="bottomSet">
					<div styleName="icon" onClick={toggleOption(Option.PluginStore)}>🛍</div>
				</div>
			</div>
			{PanelMain(option)}
		</>
	);
}

export { LeftPanel };
