import produce from 'immer';
import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';

export type SimpleRoomData = {
	// XXX: 之後要改為 id ，因為可能會撞名
	name: string,
};

export type ChannelRoomData = {
	// XXX: 之後要改為 id ，因為可能會撞名
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
		let room = chatrooms.find(room => room.name == name);
		let new_chatrooms = produce(chatrooms, draft => {
			draft = draft.filter(room => room.name != name);
			if (room) {
				// 若聊天室已經存在，將其排列到第一位
				draft.unshift(room);
			} else {
				draft.unshift({name});
			}
			return draft;
		});
		setChatrooms(new_chatrooms);
	}

	function addRoomWithChannel(name: string, channel: string): void {
		// TODO: 調整聊天室添加順序
		let room = chatrooms.find(room => room.name == name);
		let new_chatrooms = produce(chatrooms, draft => {
			draft = draft.filter(room => room.name != name);
			if (room) {
				// 若聊天室已經存在，將其排列到第一位
				draft.unshift(room);
			} else {
				draft.unshift({name, channel});
			}
			return draft;
		});
		setChatrooms(new_chatrooms);
	}

	function changeChannel(name: string, channel: string): void {
		let index = chatrooms.findIndex(room => room.name == name);
		if (index != -1) {
			setChatrooms(produce(chatrooms, draft => {
				draft[index] = {name, channel};
			}));
		} else {
			console.error(`聊天室 ${name} 不存在，無法切換頻道`);
		}
	}

	function deleteRoom(name: string): void {
		setChatrooms(chatrooms.filter(room => room.name != name));
	}

	return { chatrooms, addRoom, addRoomWithChannel, changeChannel, deleteRoom };
}

export const BottomPanelState = createContainer(useBottomPanelState);