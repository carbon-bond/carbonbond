import * as React from 'react';
import { ChatBar } from './chat_bar';
import { BrowseBar } from './browse_bar';
import { DraftBar } from './draft_bar';
import style from '../../css/sidebar.module.css';
import { NumberOver } from '../components/number_over';
import { AllChatState } from '../global_state/chat';
import { STORAGE_NAME } from '../../ts/constants';

enum Option {
	Browse         = 'Browse',
	Chat           = 'Chat',
	DiscoverFriend = 'DiscoverFriend',
	Draft          = 'Draft',
	PluginStore    = 'PluginStore',
	None           = 'None'            // 側欄關閉
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
			return <div className={style.sidebar}><DraftBar /></div>;
		case Option.PluginStore:
			return <div className={style.sidebar}>市集</div>;
		case Option.None:
			return <></>;
	}
}

function LeftPanel(): JSX.Element {
	const [option, setOption] = React.useState(Option.None);
	const { all_chat } = AllChatState.useContainer();
	// NOTE: 暫時只計算雙人對話
	const unread_chat_number = Object.values(all_chat.direct).filter(chat => chat.isUnread()).length;

	React.useEffect(() => {
		const previous_record = localStorage[STORAGE_NAME.leftbar_expand];
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
			<div className={style.menubar}>
				<div className={style.topSet}>
					<div className={style.icon} onClick={toggleOption(Option.Browse)}>🗐</div>
					<NumberOver number={unread_chat_number} className={style.icon} top="2px" left="4px">
						<div onClick={toggleOption(Option.Chat)}>🗨️</div>
					</NumberOver>
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
