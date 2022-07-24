import * as React from 'react';
import { ChatBar } from './chat_bar';
import { BrowseBar } from './browse_bar';
import { DraftBar } from './draft_bar';
import style from '../../css/left_panel/left_panel.module.css';
import { NumberOver } from '../components/number_over';
import { AllChatState } from '../global_state/chat';
import { STORAGE_NAME } from '../../ts/constants';
import { UserState } from '../global_state/user';

export enum Option {
	Browse         = 'Browse',
	Chat           = 'Chat',
	// DiscoverFriend = 'DiscoverFriend',
	Draft          = 'Draft',
	// PluginStore    = 'PluginStore',
	None           = 'None'            // 側欄關閉
}

function PanelWrap(props: { children: JSX.Element }): JSX.Element {
	return <div className={style.panel}>{props.children}</div>;
}

export function PanelMain(props: { option: Option }): JSX.Element {
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

export function PanelMenu(props: {
	option: Option,
	toggleOption: (op: Option) => ((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void)
}): JSX.Element {
	const { all_chat } = AllChatState.useContainer();
	const { user_state } = UserState.useContainer();

	const current_option = props.option;
	const toggleOption = props.toggleOption;

	function MenuButton(props: {
		option: Option,
		children: React.ReactNode,
	}): JSX.Element {
		const is_current = (props.option == current_option);
		return <div
			onClick={toggleOption(props.option)}
			className={`${style.icon} ${is_current ? style.isCurrent : ''}`} >
			{props.children}
		</div>;
	}

	// NOTE: 暫時只計算雙人對話
	const unread_chat_number = all_chat.unreadNumber();
	return <div className={style.menubar}>
		<div className={style.topSet}>
			{
				user_state.login ?
					<>
						<MenuButton option={Option.Browse}>📑</MenuButton>
						<NumberOver number={unread_chat_number} top="8px" left="8px">
							<MenuButton option={Option.Chat}>
								🗨️
							</MenuButton>
						</NumberOver>
						<MenuButton option={Option.Draft}>稿</MenuButton>
					</> :
					<>
						<MenuButton option={Option.Browse}>📑</MenuButton>
					</>
			}
		</div>
		<div className={style.bottomSet}>
			{/* <div className={style.icon} onClick={toggleOption(Option.PluginStore)}>🛍</div> */}
		</div>
	</div>;
}

function LeftPanel(): JSX.Element {
	const [option, setOption] = React.useState(Option.None);

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
			<PanelMenu option={option} toggleOption={toggleOption}/>
			<PanelMain option={option}/>
		</>
	);
}

export { LeftPanel };
