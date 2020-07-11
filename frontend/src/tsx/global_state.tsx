import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { Record, List, Map } from 'immutable';
import { CategoryBody, fetchCategories, checkCanAttach, checkCanReply, getArticleCategory } from '../ts/forum_util';
import { Article } from './board_switch';
import { useScrollState } from './utils';
import { chat_proto } from '../ts/protobuf/chat_proto.js';
import { toast } from 'react-toastify';

const {
	ServerSendData,
} = chat_proto;

type UserStateType = {
	login: false, fetching: boolean
} | {
	login: true,
	id: number,
	user_name: string,
	invitation_credit: number,
	energy: number
};

interface LoginData {
	id: number,
	user_name: string,
	invitation_credit: number,
	energy: number
}

function useUserState(): { user_state: UserStateType, setLogin: Function, setLogout: Function, getLoginState: Function } {
	const [user_state, setUserState] = useState<UserStateType>({ login: false, fetching: true });

	async function getLoginState(): Promise<void> {
		try {
			const user = unwrap(await API_FETCHER.queryMe());
			if (user) {
				setUserState({
					login: true,
					user_name: user.user_name,
					id: user.id,
					invitation_credit: user.invitation_credit,
					energy: user.energy,
				});
			} else {
				setUserState({ login: false, fetching: false });
			}
		} catch (err) {
			toast.error(err);
		}
		return;
	}

	React.useEffect(() => {
		getLoginState();
	}, []);

	function setLogin(data: LoginData): void {
		setUserState({
			login: true,
			id: data.id,
			user_name: data.user_name,
			invitation_credit: data.invitation_credit,
			energy: data.energy,
		});
	}
	function setLogout(): void {
		setUserState({ login: false, fetching: false });
	}
	return { user_state, setLogin, setLogout, getLoginState };
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
	let [chatrooms, setChatrooms] = useState<List<RoomData>>(List());

	function addRoom(name: string): void {
		// TODO: 調整聊天室添加順序
		let room = chatrooms.find(room => room.name == name);
		if (room != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			let new_chatrooms = chatrooms.filter(room => room.name != name);
			setChatrooms(new_chatrooms.unshift(room));
		} else {
			setChatrooms(chatrooms.unshift({name}));
		}
	}

	function addRoomWithChannel(name: string, channel: string): void {
		// TODO: 調整聊天室添加順序
		let room = chatrooms.find(room => room.name == name);
		if (room != undefined) {
			// 若聊天室已經存在，將其排列到第一位
			let new_chatrooms = chatrooms.filter(room => room.name != name);
			setChatrooms(new_chatrooms.unshift({ name, channel }));
		} else {
			setChatrooms(chatrooms.unshift({ name, channel }));
		}
	}

	function changeChannel(name: string, channel: string): void {
		let index = chatrooms.findIndex(room => room.name == name);
		if (index != -1) {
			setChatrooms(chatrooms.update(index, () => { return {name, channel}; }));
		} else {
			console.error(`聊天室 ${name} 不存在，無法切換頻道`);
		}
	}

	function deleteRoom(name: string): void {
		setChatrooms(chatrooms.filter(room => room.name != name));
	}

	return { chatrooms: chatrooms.toJS(), addRoom, addRoomWithChannel, changeChannel, deleteRoom };
}

export type Transfuse = -1 | 0 | 1;
type Edge = { article_id: string, category: CategoryBody , transfuse: Transfuse };
export type NewArticleArgs = {
	board_name: string,
	category?: CategoryBody,
	title?: string,
	reply_to?: { article: Article, transfuse: Transfuse },
};
export type EditorPanelData = {
	// FIXME: 只記名字的話，可能發生奇怪的錯誤，例如發文到一半看板改名字了
	board_name: string,
	categories: CategoryBody[],
	cur_category: CategoryBody,
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
						category: getArticleCategory(args.reply_to.article),
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
			new_data.edges.push({
				article_id: article.id,
				category: getArticleCategory(article),
				transfuse
			});
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

export class Message extends Record({ sender_name: '', content: '', time: new Date(0) }) {
	static fromProtobuf(message: chat_proto.IMessage): Message {
		return new Message({
			sender_name: message.senderName!,
			content: message.content!,
			time: new Date(message.time!)
		});
	}
}

export class DirectChatData extends Record({
	history: List<Message>(),
	name: '',
	id: 0,
	read_time: new Date(0)
}) implements ChatData {
	isUnread(): boolean {
		const last_msg = this.history.last(undefined);
		if (last_msg == undefined) {
			return false;
		} else {
			return this.read_time < last_msg.time;
		}
	}
	newestMessage(): Message | undefined {
		const last_msg = this.history.last(undefined);
		return last_msg;
	}
	addMessage(message: Message): DirectChatData {
		let res = this.update('history', (history) => {
			return history.push(message);
		});
		res = res.set('read_time', message.time);
		return res;
	}
}

// NOTE: 目前的 DirectChatData 與 ChannelData 完全相同
// 但之後 ChannelData 會有自己的特殊屬性，如公開／私有
class ChannelData extends DirectChatData {};

export class GroupChatData extends Record({
	name: '',
	id: 0,
	is_upgraded: false,
	channels: Map<string, ChannelData>(),
	read_time: new Date(0)
}) {
	isUnread(): boolean {
		return !this.unreadChannels().isEmpty();
	}
	unreadChannels(): List<ChannelData> {
		return this.channels.valueSeq().toList().filter(channel => channel.isUnread());
	}
	// TODO: 改名爲 newestMessage
	newestMessage(): Message | undefined {
		if (this.is_upgraded) {
			return undefined;
		} else {
			return this.channels
				.map(channel => channel.history.last(undefined))
				.filter(x => x != undefined)
				.sort((c1, c2) => Number(c1!.time) - Number(c2!.time)).first();
		}
	}
}

export interface IMessage {
	sender_name: string,
	content: string,
	time: Date
};

export interface ChatData {
	name: string;
	newestMessage(): IMessage | undefined
	isUnread(): boolean
};

class AllChat extends Record({
	group: Map<string, GroupChatData>(),
	direct: Map<string, DirectChatData>(),
}) {
	addChat(name: string, chat: DirectChatData): AllChat {
		return this.setIn(['direct', name], chat);
	}
	addMessage(name: string, message: Message): AllChat {
		return this.updateIn(['direct', name], direct => direct.addMessage(message));
	}
	addChannelMessage(name: string, channel: string, message: Message): AllChat {
		return this.updateIn(['group', name, 'channels', channel], c => c.addMessage(message));
	}
	updateReadTime(name: string, time: Date): AllChat {
		return this.updateIn(['direct', name], direct => direct.set('read_time', time));
	}
	updateChannelReadTime(name: string, channel: string, time: Date): AllChat {
		return this.updateIn(['group', name, 'channels', channel], direct => direct.set('read_time', time));
	}
}

function useAllChatState(): {
	all_chat: AllChat
	addMessage: Function
	addChannelMessage: Function
	updateLastRead: Function
	updateLastReadChannel: Function
	} {

	let [all_chat, setAllChat] = useState<AllChat>(new AllChat({
		// TODO: 刪掉假數據
		group: Map({
			'無限城': new GroupChatData({
				name: '無限城',
				channels: Map({
					'VOLTS 四天王': new ChannelData({
						name: 'VOLTS 四天王',
						history: List([
							new Message({ sender_name: '冬木士度', content: '那時我認爲他是個怪人', time: new Date(2019, 6, 14) }),
							new Message({ sender_name: '風鳥院花月', content: '我也是', time: new Date(2019, 6, 15) })
						]),
						read_time: new Date(2019, 7, 13)
					}),
					'主頻道': new ChannelData({
						name: '主頻道',
						history: List([
							new Message({ sender_name: '美堂蠻', content: '午餐要吃什麼？', time: new Date(2019, 1, 14) }),
							new Message({ sender_name: '馬克貝斯', content: '沒意見', time: new Date(2019, 1, 15) }),
							new Message({ sender_name: '天子峰', content: '都可', time: new Date(2019, 1, 16) })
						]),
						read_time: new Date(2018, 7, 13)
					}),
					'閃靈二人組': new ChannelData({
						name: '閃靈二人組',
						history: List([
							new Message({ sender_name: '天野銀次', content: '肚子好餓', time: new Date(2018, 11, 4) }),
							new Message({ sender_name: '美堂蠻', content: '呿！', time: new Date(2019, 3, 27) })
						]),
						read_time: new Date(2018, 6, 13)
					})
				})
			})
		}),
		direct: Map({ })
	}));


	React.useEffect(() => {
		const _onmessage = (event: MessageEvent): void => {
			const buf = new Uint8Array(event.data);
			const data = ServerSendData.decode(buf);
			switch (data.Data) {
				case 'recentChatResponse': {
					const recent_chats = data.recentChatResponse!.chats!.chats!;
					let new_all_chat = all_chat;
					for (let chat of recent_chats) {
						if (chat.directChat) {
							console.log(`direct chat id: ${chat.directChat.directChatId}`);
							let direct_chat_data = new DirectChatData({
								id: chat.directChat.directChatId!,
								name: chat.directChat.name!,
								history: List([Message.fromProtobuf(chat.directChat.latestMessage!)]),
								read_time: new Date(chat.directChat.readTime!),
							});
							new_all_chat = new_all_chat.addChat(chat.directChat.name!, direct_chat_data);
						}
						// TODO: chat.groupChat, chat.upgradedGroupChat
					}
					setAllChat(new_all_chat);
					break;
				}
				default: {
					console.error('聊天 websocket 收到未識別的資料型別');
				}
			}
			console.log(data.recentChatResponse);
		};
		// window.chat_socket.setHandler(onmessage);
	}, [all_chat]);

	function addMessage(name: string, message: Message): void {
		setAllChat(all_chat.addMessage(name, message));
	}

	function addChannelMessage(name: string, channel_name: string, message: Message): void {
		setAllChat(all_chat.addChannelMessage(name, channel_name, message));
	}

	// 只作用於雙人
	function updateLastRead(name: string, time: Date): void {
		setAllChat(all_chat.updateReadTime(name, time));
	}

	function updateLastReadChannel(name: string, channel_name: string, time: Date): void {
		setAllChat(all_chat.updateChannelReadTime(name, channel_name, time));
	}

	return {
		all_chat,
		addMessage,
		addChannelMessage,
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
