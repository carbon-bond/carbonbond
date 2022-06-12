import * as React from 'react';
import { ChatBar } from './chat_bar';
import { BrowseBar } from './browse_bar';
import { DraftBar } from './draft_bar';
import style from '../../css/left_panel/left_panel.module.css';
import { NumberOver } from '../components/number_over';
import { AllChatState } from '../global_state/chat';
import { STORAGE_NAME } from '../../ts/constants';
import { UserState } from '../global_state/user';

enum Option {
	Browse         = 'Browse',
	Chat           = 'Chat',
	// DiscoverFriend = 'DiscoverFriend',
	Draft          = 'Draft',
	// PluginStore    = 'PluginStore',
	None           = 'None'            // 側欄關閉
}

function PanelWrap(props: { children: JSX.Element }): JSX.Element {
	return <div className="panel"><div className={style.panel}>{props.children}</div></div>;
}

function PanelMain(props: { option: Option }): JSX.Element {
	switch (props.option) {
		case Option.Browse:
			return <PanelWrap><BrowseBar /></PanelWrap>;
		case Option.Chat:
			return <PanelWrap><ChatBar /></PanelWrap>;
		// case Option.DiscoverFriend:
			// return <PanelWrap><DiscoverFriendBar /></PanelWrap>;
		case Option.Draft:
			return <PanelWrap><DraftBar /></PanelWrap>;
		// case Option.PluginStore:
			// return <PanelWrap><PluginStoreBar /></PanelWrap>;
		case Option.None:
			return <></>;
	}
}

function LeftPanel(): JSX.Element {
	const [option, setOption] = React.useState(Option.None);
	const { all_chat } = AllChatState.useContainer();
	const { user_state } = UserState.useContainer();
	// NOTE: 暫時只計算雙人對話
	const unread_chat_number = all_chat.unreadNumber();

	React.useEffect(() => {
		const previous_record = localStorage[STORAGE_NAME.leftbar_expand] ?? Option.Browse;
		setOption(previous_record);
	}, []);

	function toggleOption(op: Option): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
		return () => {
			if (op == option) {
				setOption(Option.None);
				localStorage[STORAGE_NAME.leftbar_expand] = Option.None;
			} else {
				setOption(op);
				localStorage[STORAGE_NAME.leftbar_expand] = op;
			}
		};
	}

	return (
		<>
			<div className="menubar">
				<div className={style.menubarInner}>
					<div className={style.topSet}>
						{
							user_state.login ?
								<>
									<div className={style.icon} onClick={toggleOption(Option.Browse)}>📑</div>
									<NumberOver number={unread_chat_number} className={style.icon} top="2px" left="4px">
										<div onClick={toggleOption(Option.Chat)}>🗨️</div>
									</NumberOver>
									{/* <div className={style.icon} onClick={toggleOption(Option.DiscoverFriend)}>💑</div> */}
									<div className={style.icon} onClick={toggleOption(Option.Draft)}>稿</div>
								</> :
								<>
									<div className={style.icon} onClick={toggleOption(Option.Browse)}>📑</div>
								</>
						}
					</div>
					<div className={style.bottomSet}>
						{/* <div className={style.icon} onClick={toggleOption(Option.PluginStore)}>🛍</div> */}
					</div>
				</div>
			</div>
			<PanelMain option={option}/>
		</>
	);
}

export { LeftPanel };
