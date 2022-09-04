import produce from 'immer';
import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';

export enum RoomKind {
	Simple, Channel
};

export type SimpleRoomData = {
	kind: RoomKind.Simple,
	id: number,
};

export type ChannelRoomData = {
	kind: RoomKind.Channel,
	id: number,
	channel: string
};


export type RoomData = SimpleRoomData | ChannelRoomData;

export function isChannelRoomData(x: RoomData): x is ChannelRoomData {
	return (x as ChannelRoomData).channel !== undefined;
}

// 僅用於行動版
export type ChosenBubble = {
	kind: 'chat',
	chatroom: RoomData,
} | {
	kind: 'editor',
};

function useBottomPanelState(): {
	chatrooms: RoomData[],
	chosen_bubble: ChosenBubble | null,
	setChosenBubble: (chosen_bubble: ChosenBubble | null) => void,
	clearRoom: () => void,
	addRoom: (id: number) => void,
	addRoomWithChannel: (id: number, channel: string) => void,
	changeChannel: (id: number, channel: string) => void,
	deleteRoom: (id: number, kind: RoomKind) => void,
	toRealRoom: (fake_id: number, id: number) => void,
	} {
	let [chatrooms, setChatrooms] = useState<RoomData[]>([]);
	let [chosen_bubble, setChosenBubble] = useState<ChosenBubble | null>(null);

	function clearRoom(): void {
		setChatrooms([]);
	}
	function addRoom(id: number): void {
		// TODO: 調整聊天室添加順序
		let room = chatrooms.find(room => room.id == id && room.kind == RoomKind.Simple) ?? { id, kind: RoomKind.Simple };
		let new_chatrooms = produce(chatrooms, draft => {
			draft = draft.filter(room => room.id != id);
			// 若聊天室已經存在，將其排列到第一位
			// 若不存在，將其新增到第一位
			draft.unshift(room);
			return draft;
		});
		setChatrooms(new_chatrooms);
		setChosenBubble({ kind: 'chat', chatroom: room });
	}

	function addRoomWithChannel(id: number, channel: string): void {
		// TODO: 調整聊天室添加順序
		let room = chatrooms.find(room => room.id == id && room.kind == RoomKind.Channel);
		let new_chatrooms = produce(chatrooms, draft => {
			draft = draft.filter(room => room.id != id);
			if (room) {
				// 若聊天室已經存在，將其排列到第一位
				draft.unshift(room);
			} else {
				draft.unshift({id, channel, kind: RoomKind.Channel});
			}
			return draft;
		});
		setChatrooms(new_chatrooms);
	}

	function changeChannel(id: number, channel: string): void {
		let index = chatrooms.findIndex(room => room.id == id && room.kind == RoomKind.Channel);
		if (index != -1) {
			setChatrooms(produce(chatrooms, draft => {
				draft[index] = {id, channel, kind: RoomKind.Channel};
			}));
		} else {
			console.error(`聊天室 ${id} 不存在，無法切換頻道`);
		}
	}

	function deleteRoom(id: number, kind: RoomKind): void {
		setChatrooms(chatrooms.filter(room => room.id != id || room.kind != kind));
	}

	function toRealRoom(fake_id: number, id: number): void {
		let new_rooms = produce(chatrooms, (chatrooms) => {
			let room = chatrooms.find(room => room.id == fake_id && room.kind == RoomKind.Simple);
			if (room) {
				room.id = id;
			}
		});
		setChatrooms(new_rooms);
		setChosenBubble({ kind: 'chat', chatroom: { id, kind: RoomKind.Simple } });
	}

	return {
		chatrooms,
		chosen_bubble,
		setChosenBubble,
		clearRoom,
		addRoom,
		addRoomWithChannel,
		changeChannel,
		deleteRoom,
		toRealRoom
	};
}

export const BottomPanelState = createContainer(useBottomPanelState);