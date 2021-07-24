import * as React from 'react';
import { ChatBar } from '../tsx/chatbar';
import { BrowseBar } from './browsebar';
import style from '../css/sidebar.module.css';

enum Option {
	Browse,
	Chat,
	DiscoverFriend,
	Draft,
	PluginStore,
	None            // 側欄關閉
}

function PanelMain(props: { option: Option }): JSX.Element {
	switch (props.option) {
		case Option.Browse:
			return <div className={style.sidebar}><BrowseBar /></div>;
		case Option.Chat:
			return <div className={style.sidebar}><ChatBar /></div>;
		case Option.DiscoverFriend:
			return <div className={style.sidebar}>交友</div>;
		case Option.Draft:
			return <div className={style.sidebar}>草稿匣</div>;
		case Option.PluginStore:
			return <div className={style.sidebar}>市集</div>;
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
			<div className={style.menubar}>
				<div className={style.topSet}>
					<div className={style.icon} onClick={toggleOption(Option.Browse)}>🗐</div>
					<div className={style.icon} onClick={toggleOption(Option.Chat)}>🗨️</div>
					<div className={style.icon} onClick={toggleOption(Option.DiscoverFriend)}>💑</div>
					<div className={style.icon} onClick={toggleOption(Option.Draft)}>稿</div>
				</div>
				<div className={style.bottomSet}>
					<div className={style.icon} onClick={toggleOption(Option.PluginStore)}>🛍</div>
				</div>
			</div>
			<PanelMain option={option}/>
		</>
	);
}

export { LeftPanel };
