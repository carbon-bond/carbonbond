import * as React from 'react';
import { createContainer } from 'unstated-next';
import { BoardName } from '../../ts/api/api_trait';

type SetBoard = (b: BoardName | null) => void;

function useBoardCacheState(): {
	board: BoardName | null,
	setBoard: SetBoard
	} {
	let [board, _setBoard] = React.useState<BoardName | null>(null);
	let setBoard = React.useCallback((board: BoardName | null) => {
		_setBoard(board);
	}, []);
	return {
		board,
		setBoard
	};
}

export const BoardCacheState = createContainer(useBoardCacheState);