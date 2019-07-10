import * as React from 'react';
import '../css/sidebar.css';

enum Option {
	Browse,
	Search,
	Chat,
	Notify,
	DiscoverFriend,
	PluginStore
}

function PanelMain(option: Option): JSX.Element {
	switch (option) {
		case Option.Browse:
			return <>瀏覽</>;
		case Option.Search:
			return <>搜尋</>;
		case Option.Chat:
			return <>即時訊息</>;
		case Option.Notify:
			return <>通知</>;
		case Option.DiscoverFriend:
			return <>交友</>;
		case Option.PluginStore:
			return <>外掛市場</>;
	}
}

function LeftPanel(): JSX.Element {
	const [option, setOption] = React.useState(Option.Browse);

	return (
		<>
			<div styleName="menubar">
				<div styleName="topSet">
					<div styleName="icon" onClick={() => {setOption(Option.Browse);}}>🗐</div>
					<div styleName="icon" onClick={() => {setOption(Option.Search);}}>🔍</div>
					<div styleName="icon" onClick={() => {setOption(Option.Chat);}}>🗨️</div>
					<div styleName="icon" onClick={() => {setOption(Option.Notify);}}>🕭</div>
					<div styleName="icon" onClick={() => {setOption(Option.DiscoverFriend);}}>💑</div>
				</div>
				<div styleName="bottomSet">
					<div styleName="icon" onClick={() => {setOption(Option.PluginStore);}}>🛍</div>
				</div>
			</div>
			<div styleName="sidebar">
				{PanelMain(option)}
			</div>
		</>
	);
}

export { LeftPanel };
