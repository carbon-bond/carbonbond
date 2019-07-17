import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import * as api from './api';
import { produce } from 'immer';

type UserStateType = { login: false, fetching: boolean } | { login: true, user_id: string };

function useUserState(): { user_state: UserStateType, set_login: Function, set_logout: Function } {
	let [user_state, setLogin] = useState<UserStateType>({ login: false, fetching: true });

	async function get_login_state(): Promise<{}> {
		const data = await api.me_request();
		if (data.me.id != null) {
			setLogin({ login: true, user_id: data.me.id });
		} else {
			setLogin({ login: false, fetching: false });
		}
		return {};
	}

	React.useEffect(() => {
		get_login_state();
	}, []);

	function set_login(user_id: string): void {
		setLogin({ login: true, user_id: user_id });
	}
	function set_logout(): void {
		setLogin({ login: false, fetching: false });
	}
	return { user_state, set_login, set_logout };
}

type ChatRoom = {
	// XXX: 之後要改爲 id ，因爲可能會撞名
	name: string,
};

function useBottomPanelState(): {
	chatrooms: ChatRoom[],
	add_room: Function,
	delete_room: Function,
	} {
	let [chatrooms, set_chatrooms] = useState<ChatRoom[]>([]);

	function add_room(name: string): void {
		// TODO: 調整聊天室添加順序
		if (chatrooms.find(room => room.name == name) != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			chatrooms = chatrooms.filter(room => room.name != name);
			chatrooms = [{name}, ...chatrooms];
		} else {
			// NOTE: 是否該引入 immutable.js ?
			chatrooms = [{name}, ...chatrooms];
		}
		set_chatrooms(chatrooms);
	}

	function delete_room(name: string): void {
		set_chatrooms(chatrooms.filter(room => room.name != name));
	}

	return { chatrooms, add_room, delete_room };
}

export type NewArticleArgs = {
	board_name: string,
	category_name?: string,
	title?: string,
	edges?: { article_id: string, transfuse: number }[]
};
export type EditorPanelData = {
	// FIXME: 只記名字的話，可能發生奇怪的錯誤，例如發文到一半看板改名字了
	board_name: string,
	category_name?: string,
	title: string,
	edges: { article_id: string, transfuse: number }[],
	content: string // TODO: 之後應該是 string[]
};

function useEditorPanelState(): {
	open: boolean,
	openEditorPanel: (new_article_args?: NewArticleArgs) => void,
	closeEditorPanel: () => void,
	editor_panel_data: EditorPanelData | null,
	setEditorPanelData: (data: EditorPanelData | null) => void
	} {
	let [editor_panel_data, setEditorPanelData] = useState<EditorPanelData | null>(null);
	let [open, setOpen] = useState(false);
	function openEditorPanel(new_article_args?: NewArticleArgs): void {
		if (new_article_args) {
			// 開新文來編輯
			if (editor_panel_data) {
				// TODO: 錯誤處理，編輯其它文章到一半試圖直接切換文章
				return;
			} else {
				setEditorPanelData({
					board_name: new_article_args.board_name,
					category_name: new_article_args.category_name,
					title: new_article_args.title || '',
					edges: new_article_args.edges || []
				});
			}
		} else if (!editor_panel_data) {
			// TODO: 錯誤處理，沒有任何資訊卻想打開編輯視窗
		}
		setOpen(true);
	}
	function closeEditorPanel(): void {
		setOpen(false);
	}
	return {
		open,
		openEditorPanel,
		closeEditorPanel,
		editor_panel_data,
		setEditorPanelData
	};
}


export type Dialog = {
	who: string,
	content: string,
	date: Date
};

export interface ChatData {
	name: string;
	newest_dialog(): Dialog
	newest_channel_name(): string | null;
};

// TODO: 增加一個欄位表示最後閱讀的時間
export class SimpleChatData implements ChatData {
	name: string;
	dialogs: Dialog[];
	constructor(name: string, dialogs: Dialog[]) {
		this.name = name;
		this.dialogs = dialogs;
	}
	newest_dialog(): Dialog {
		return this.dialogs.slice(-1)[0];
	}
	newest_channel_name(): null { return null; }
};

export class ChannelChatData implements ChatData {
	name: string;
	channels: SimpleChatData[];
	constructor(name: string, channels: SimpleChatData[]) {
		this.name = name;
		this.channels = channels;
	}
	newest_channel(): SimpleChatData {
		return this.channels.reduce((prev, cur) => {
			return Number(prev.newest_dialog().date) > Number(cur.newest_dialog().date) ? prev : cur;
		});
	}
	newest_dialog(): Dialog {
		return this.newest_channel().newest_dialog();
	}
	newest_channel_name(): string {
		return this.newest_channel().name;
	}
};

type AllChat = {
	party: ChannelChatData[],
	group: SimpleChatData[],
	two_people: SimpleChatData[]
};

function useAllChatState(): {
	all_chat: AllChat
	add_dialog: Function
	} {

	let [all_chat, set_all_chat] = useState<AllChat>({
		party: [
			new ChannelChatData('無限城',
				[
					new SimpleChatData(
						'VOLTS 四天王',
						[
							{ who: '冬木士度', content: '那時我認爲他是個怪人', date: new Date(2019, 6, 14) },
							{ who: '風鳥院花月', content: '我也是', date: new Date(2019, 6, 15) }
						]
					),
					new SimpleChatData(
						'閃靈二人組',
						[
							{ who: '天野銀次', content: '肚子好餓', date: new Date(2018, 11, 4) },
							{ who: '美堂蠻', content: '呿！', date: new Date(2019, 3, 27) }
						]
					)
				],
			)
		],
		group: [],
		// TODO: 刪掉假數據
		two_people: [
			new SimpleChatData('玻璃碳', [{ who: '金剛', content: '安安', date: new Date() }]),
			new SimpleChatData('石墨', [{ who: '石墨', content: '送出了一張貼圖', date: new Date(2019, 6, 12) }]),
			new SimpleChatData('六方', [{ who: '六方', content: '幫幫窩', date: new Date(2018, 6) }]),
			new SimpleChatData('芙', [{ who: '芙', content: '一直流鼻涕', date: new Date(2019, 6) }]),
		]
	});

	// 只作用於雙人
	function add_dialog(name: string, dialog: Dialog): void {
		let new_chat = produce(all_chat, draft => {
			let chat = draft.two_people.find((d) => d.name == name);
			if (chat != undefined) {
				chat!.dialogs.push(dialog);
			} else {
				console.warn(`不存在雙人對話 ${name}`);
			}
		});
		set_all_chat(new_chat);
	}

	return { all_chat: all_chat, add_dialog };
}

export const UserState = createContainer(useUserState);
export const BottomPanelState = createContainer(useBottomPanelState);
export const AllChatState = createContainer(useAllChatState);
export const EditorPanelState = createContainer(useEditorPanelState);