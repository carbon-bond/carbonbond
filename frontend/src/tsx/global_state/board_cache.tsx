import * as React from 'react';
import { createContainer } from 'unstated-next';

type SetBoard = (b: string | null) => void;

function useBoardCacheState(): {
	cur_board: string | null,
	setCurBoard: SetBoard
	} {
	let [cur_board, _setBoard] = React.useState<string | null>(null);
	let setCurBoard = React.useCallback((board: string | null) => {
		_setBoard(board);
	}, []);
	return {
		cur_board,
		setCurBoard
	};
}

export const BoardCacheState = createContainer(useBoardCacheState);