import { createContainer } from 'unstated-next';
import { useState } from 'react';
import { Map } from 'immutable';
import { BoardOverview } from '../../ts/api/api_trait';

function useSubecribedBoardsState(): {
	subscribed_boards: Map<number, BoardOverview>,
	subscribe: (board: BoardOverview) => void,
	unsubscribe: (id: number) => void,
	load: (boards: BoardOverview[]) => void
} {
	let [data, setData] = useState(Map<number, BoardOverview>());
	let subscribe = (board: BoardOverview) => {
		setData(m => {
			return m.set(board.id, board);
		});
	}
	let unsubscribe = (id: number) => {
		setData(m => {
			return m.remove(id);
		});
	}
	let load = (boards: BoardOverview[]) => {
		let list: [number, BoardOverview][] = []
		for (const board of boards) {
			list.push([board.id, board]);
		}
		setData(Map(list));
	}
	return {
		subscribed_boards: data,
		unsubscribe,
		subscribe,
		load,
	}
}

export const SubscribedBoardsState = createContainer(useSubecribedBoardsState);