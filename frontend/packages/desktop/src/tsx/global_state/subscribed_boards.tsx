import { createContainer } from 'unstated-next';
import { useCallback } from 'react';
import { useImmer } from 'use-immer';
import { BoardOverview } from '../../ts/api/api_trait';

type SubscribedBoards = {[key: number]: BoardOverview};

function useSubecribedBoardsState(): {
	subscribed_boards: SubscribedBoards,
	subscribe: (board: BoardOverview) => void,
	unsubscribe: (id: number) => void,
	load: (boards: BoardOverview[]) => void,
	unload: () => void,
	} {
	let [data, setData] = useImmer<SubscribedBoards>({});
	let subscribe = useCallback((board: BoardOverview): void => {
		setData((boards) => {
			boards[board.id] = board;
		});
	}, [setData]);
	let unsubscribe = useCallback((id: number): void => {
		setData(boards => {
			delete boards[id];
		});
	}, [setData]);
	let unload = useCallback((): void => {
		setData({});
	}, [setData]);
	let load = useCallback((boards: BoardOverview[]): void => {
		let list: {[key: number]: BoardOverview} = {};
		for (const board of boards) {
			list[board.id] = board;
		}
		setData(list);
	}, [setData]);
	return {
		subscribed_boards: data,
		unsubscribe,
		subscribe,
		unload,
		load,
	};
}

export const SubscribedBoardsState = createContainer(useSubecribedBoardsState);