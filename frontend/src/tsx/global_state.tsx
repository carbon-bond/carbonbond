import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { gqlFetcher, GQL } from '../ts/api';
import { produce, immerable } from 'immer';
import { Category, fetchCategories, checkCanAttach, checkCanReply, getArticleCategory } from '../ts/forum_util';
import { Article } from './board_switch';
import { useScrollState } from './utils';

type UserStateType = { login: false, fetching: boolean } | { login: true, user_id: string };

function useUserState(): { user_state: UserStateType, setLogin: Function, setLogout: Function } {
	const [user_state, setUserState] = useState<UserStateType>({ login: false, fetching: true });

	async function getLoginState(): Promise<{}> {
		const data = await GQL.MeAjax(gqlFetcher);
		if (data.me.id != null) {
			setUserState({ login: true, user_id: data.me.id });
		} else {
			setUserState({ login: false, fetching: false });
		}
		return {};
	}

	React.useEffect(() => {
		getLoginState();
	}, []);

	function setLogin(user_id: string): void {
		setUserState({ login: true, user_id: user_id });
	}
	function setLogout(): void {
		setUserState({ login: false, fetching: false });
	}
	return { user_state, setLogin, setLogout };
}

export type SimpleRoomData = {
	// XXX: 之後要改爲 id ，因爲可能會撞名
	name: string
};

export type ChannelRoomData = {
	// XXX: 之後要改爲 id ，因爲可能會撞名
	name: string,
	channel: string
};


export type RoomData = SimpleRoomData | ChannelRoomData;

export function isChannelRoomData(x: RoomData): x is ChannelRoomData {
	return (x as ChannelRoomData).channel !== undefined;
}

function useBottomPanelState(): {
	chatrooms: RoomData[],
	addRoom: Function,
	addRoomWithChannel: Function,
	changeChannel: Function,
	deleteRoom: Function,
	} {
	let [chatrooms, setChatrooms] = useState<RoomData[]>([]);

	function addRoom(name: string): void {
		// TODO: 調整聊天室添加順序
		if (chatrooms.find(room => room.name == name) != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			chatrooms = chatrooms.filter(room => room.name != name);
			chatrooms = [{name}, ...chatrooms];
		} else {
			chatrooms = [{name}, ...chatrooms];
		}
		setChatrooms(chatrooms);
	}

	function addRoomWithChannel(name: string, channel: string): void {
		// TODO: 調整聊天室添加順序
		if (chatrooms.find(room => room.name == name) != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			chatrooms = chatrooms.filter(room => room.name != name);
			chatrooms = [{name, channel}, ...chatrooms];
		} else {
			chatrooms = [{name, channel}, ...chatrooms];
		}
		setChatrooms(chatrooms);
	}

	function changeChannel(name: string, channel: string): void {
		if (chatrooms.find(room => room.name == name) != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			const new_rooms = produce(chatrooms, draft => {
				const chatroom = draft.find(room => room.name == name);
				(chatroom as ChannelRoomData).channel = channel;
			});
			setChatrooms(new_rooms);
		} else {
			console.error(`聊天室 ${name} 不存在，無法切換頻道`);
		}
	}

	function deleteRoom(name: string): void {
		setChatrooms(chatrooms.filter(room => room.name != name));
	}

	return { chatrooms, addRoom, addRoomWithChannel, changeChannel, deleteRoom };
}

export type Transfuse = -1 | 0 | 1;
type Edge = { article_id: string, category: Category , transfuse: Transfuse };
export type NewArticleArgs = {
	board_name: string,
	category?: Category,
	title?: string,
	reply_to?: { article: Article, transfuse: Transfuse },
};
export type EditorPanelData = {
	// FIXME: 只記名字的話，可能發生奇怪的錯誤，例如發文到一半看板改名字了
	board_name: string,
	categories: Category[],
	cur_category: Category,
	title: string,
	edges: Edge[],
	content: string[],
	root_id?: string
};

function useEditorPanelState(): {
	open: boolean,
	openEditorPanel: (new_article_args?: NewArticleArgs) => Promise<void>,
	closeEditorPanel: () => void,
	editor_panel_data: EditorPanelData | null,
	setEditorPanelData: React.Dispatch<React.SetStateAction<EditorPanelData|null>>,
	addEdge: (article: Article, transfuse: Transfuse) => void
	} {
	let [data, setData] = useState<EditorPanelData | null>(null);
	let [open, setOpen] = useState(false);

	async function openEditorPanel(args?: NewArticleArgs): Promise<void> {
		if (args) {
			// 開新文來編輯
			if (data) {
				// TODO: 錯誤處理，編輯其它文章到一半試圖直接切換文章
				return;
			} else {
				let attached_to = args.reply_to ? [getArticleCategory(args.reply_to.article)] : [];
				let categories = await fetchCategories(args.board_name);
				let cur_category = (() => {
					if (args.category) {
						if (!checkCanAttach(args.category, attached_to)) {
							throw new Error('指定了一個無法選擇的分類');
						} else {
							return args.category;
						}
					} else {
						let list = categories.filter(c => checkCanAttach(c, attached_to));
						if (list.length == 0) {
							throw new Error('沒有任何分類適用');
						} else {
							return list[0];
						}
					}
				})();

				let edges: Edge[] = [];
				if (args.reply_to) {
					edges.push({
						article_id: args.reply_to.article.id,
						category: args.reply_to.article.category,
						transfuse: args.reply_to.transfuse
					});
				}

				setData({
					cur_category,
					categories,
					root_id: args.reply_to ? args.reply_to.article.rootId : undefined,
					edges,
					board_name: args.board_name,
					title: args.title || '',
					content: Array(cur_category.structure.length).fill('')
				});
			}
		} else if (!data) {
			// TODO: 錯誤處理，沒有任何資訊卻想打開編輯視窗
		}
		setOpen(true);
	}
	function closeEditorPanel(): void {
		setOpen(false);
	}
	function addEdge(article: Article, transfuse: Transfuse): void {
		if (data) {
			checkCanReply(data, article, transfuse);
			let new_data = { ...data };
			new_data.root_id = article.rootId;
			new_data.edges.push({ article_id: article.id, transfuse, category: article.category });
			setData(new_data);
		}
	}
	function setEditorPanelData(
		arg: EditorPanelData | null | ((d: EditorPanelData | null) => EditorPanelData|null)
	): void {
		let new_data = (() => {
			if (typeof arg == 'function') {
				return arg(data);
			} else {
				return arg;
			}
		})();
		if (new_data && new_data.edges.length == 0) {
			new_data.root_id = undefined;
		}
		setData(new_data);
	}
	return {
		open,
		openEditorPanel,
		closeEditorPanel,
		editor_panel_data: data,
		setEditorPanelData,
		addEdge
	};
}


export type Dialog = {
	who: string,
	content: string,
	date: Date
};

export interface ChatData {
	name: string;
	newestDialog(): Dialog
	isUnread(): boolean
};

// TODO: 增加一個欄位表示最後閱讀的時間
export class SimpleChatData implements ChatData {
	name: string;
	dialogs: Dialog[];
	last_read: Date;
	constructor(name: string, dialogs: Dialog[], last_read: Date) {
		this.name = name;
		this.dialogs = dialogs;
		this.last_read = last_read;
	}
	newestDialog(): Dialog {
		return this.dialogs.slice(-1)[0];
	}
	isUnread(): boolean {
		return this.last_read < this.newestDialog().date;
	}
};

// 爲了讓 immer 作用於 class ，但又繞不過 ts 的型別檢查
// @ts-ignore
SimpleChatData[immerable] = true;

export class ChannelChatData implements ChatData {
	name: string;
	channels: SimpleChatData[];
	constructor(name: string, channels: SimpleChatData[]) {
		this.name = name;
		this.channels = channels;
	}
	newestChannel(): SimpleChatData {
		return this.channels.reduce((prev, cur) => {
			return Number(prev.newestDialog().date) > Number(cur.newestDialog().date) ? prev : cur;
		});
	}
	newestDialog(): Dialog {
		return this.newestChannel().newestDialog();
	}
	unreadChannels(): string[] {
		return this.channels.filter(c => c.isUnread()).map(c => c.name);
	}
	isUnread(): boolean {
		return this.unreadChannels().length > 0;
	}
};

// @ts-ignore
ChannelChatData[immerable] = true;

type AllChat = {
	party: ChannelChatData[],
	two_people: SimpleChatData[]
};

function useAllChatState(): {
	all_chat: AllChat
	addDialog: Function
	addChannelDialog: Function
	updateLastRead: Function
	updateLastReadChannel: Function
	} {

	let [all_chat, setAllChat] = useState<AllChat>({
		party: [
			new ChannelChatData('無限城',
				[
					new SimpleChatData(
						'VOLTS 四天王',
						[
							{ who: '冬木士度', content: '那時我認爲他是個怪人', date: new Date(2019, 6, 14) },
							{ who: '風鳥院花月', content: '我也是', date: new Date(2019, 6, 15) }
						],
						new Date(2019, 7, 13)
					),
					new SimpleChatData(
						'主頻道',
						[
							{ who: '美堂蠻', content: '午餐要吃什麼？', date: new Date(2019, 1, 14) },
							{ who: '馬克貝斯', content: '沒意見', date: new Date(2019, 1, 15) },
							{ who: '天子峰', content: '都可', date: new Date(2019, 1, 16) }
						],
						new Date(2018, 7, 13)
					),
					new SimpleChatData(
						'閃靈二人組',
						[
							{ who: '天野銀次', content: '肚子好餓', date: new Date(2018, 11, 4) },
							{ who: '美堂蠻', content: '呿！', date: new Date(2019, 3, 27) }
						],
						new Date(2018, 6, 13)
					)
				],
			)
		],
		// TODO: 刪掉假數據
		two_people: [
			new SimpleChatData('玻璃碳', [{ who: '金剛', content: '安安', date: new Date() }], new Date(2019, 3, 3)),
			new SimpleChatData('石墨', [{ who: '石墨', content: '送出了一張貼圖', date: new Date(2019, 5, 12) }], new Date(2019, 3, 3)),
			new SimpleChatData('六方', [{ who: '六方', content: '幫幫窩', date: new Date(2018, 6) }], new Date(2019, 3, 3)),
			new SimpleChatData('芙', [{ who: '芙', content: '一直流鼻涕', date: new Date(2019, 6) }], new Date(2019, 6, 3)),
		]
	});

	// 只作用於雙人
	function addDialog(name: string, dialog: Dialog): void {
		let new_chat = produce(all_chat, draft => {
			let chat = draft.two_people.find((d) => d.name == name);
			if (chat != undefined) {
				chat!.dialogs.push(dialog);
				chat!.last_read = dialog.date;
			} else {
				console.error(`不存在雙人對話 ${name}`);
			}
		});
		setAllChat(new_chat);
	}

	// 只作用於雙人
	function addChannelDialog(name: string, channel_name: string, dialog: Dialog): void {
		let new_chat = produce(all_chat, draft => {
			const chat = draft.party.find((d) => d.name == name);
			if (chat == undefined) {
				console.error(`不存在政黨 ${name}`);
				return;
			}
			const channel = chat.channels.find(c => c.name == channel_name);
			if (channel == undefined) {
				console.error(`不存在頻道 ${channel_name}`);
				return;
			}
			channel.dialogs.push(dialog);
			channel.last_read = dialog.date;
		});
		setAllChat(new_chat);
	}

	// 只作用於雙人
	function updateLastRead(name: string, date: Date): void {
		let new_chat = produce(all_chat, draft => {
			let chat = draft.two_people.find((d) => d.name == name);
			if (chat == undefined) {
				console.error(`不存在雙人對話 ${name}`);
				return;
			}
			chat!.last_read = date;
		});
		setAllChat(new_chat);
	}

	function updateLastReadChannel(name: string, channel_name: string, date: Date): void {
		let new_chat = produce(all_chat, draft => {
			const chat = draft.party.find((d) => d.name == name);
			if (chat == undefined) {
				console.error(`不存在政黨 ${name}`);
				return;
			}
			const channel = chat.channels.find(c => c.name == channel_name);
			if (channel == undefined) {
				console.error(`不存在頻道 ${channel_name}`);
				return;
			}
			channel.last_read = date;
		});
		setAllChat(new_chat);
	}

	return {
		all_chat,
		addDialog,
		addChannelDialog,
		updateLastRead,
		updateLastReadChannel
	};
}

function useMainScrollState(): {
	setEmitter: (emitter: HTMLElement | null) => void,
	useScrollToBottom: (handler: () => void) => void
	} {
	return useScrollState();
}

export const UserState = createContainer(useUserState);
export const BottomPanelState = createContainer(useBottomPanelState);
export const AllChatState = createContainer(useAllChatState);
export const EditorPanelState = createContainer(useEditorPanelState);
export const MainScrollState = createContainer(useMainScrollState);