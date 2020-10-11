import * as React from 'react';
import { createContainer } from 'unstated-next';
import { BoardName } from '../../ts/api/api_trait';

type SetBoard = (b: BoardName | null) => void;

function useBoardCacheState(): {
    board: BoardName | null,
    setBoard: SetBoard
    } {
	let [board, setBoard] = React.useState<BoardName | null>(null);
	return {
		board,
		setBoard: (b: BoardName | null) => setBoard(b)
	};
}

export const BoardCacheState = createContainer(useBoardCacheState);