import * as React from 'react';
const { useState } = React;
import { List } from 'immutable';
import { createContainer } from 'unstated-next';

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

export const BottomPanelState = createContainer(useBottomPanelState);