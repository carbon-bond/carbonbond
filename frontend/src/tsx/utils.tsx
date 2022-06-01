import * as React from 'react';
import { toast } from 'react-toastify';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { Board } from '../ts/api/api_trait';
import { SubscribedBoardsState } from './global_state/subscribed_boards';

type InputEvent = React.ChangeEvent<HTMLInputElement>
	| React.ChangeEvent<HTMLTextAreaElement>
	| React.ChangeEvent<HTMLSelectElement>;

export function toastErr(err: unknown): void {
	toast.error(JSON.stringify(err));
}

type ToggleSubscribe = () => Promise<void>;
export function useSubscribeBoard(board: Board): { has_subscribed: boolean, toggleSubscribe: ToggleSubscribe } {
	let { subscribed_boards, subscribe, unsubscribe } = SubscribedBoardsState.useContainer();
	let has_subscribed = subscribed_boards[board.id] != undefined;

	async function onUnsubscribeBoardClick(): Promise<void> {
		console.log('按下取消訂閱看板');
		try {
			unwrap(await API_FETCHER.userQuery.unsubscribeBoard(board.id));
			unsubscribe(board.id);
		} catch (err) {
			toastErr(err);
		}
	}
	async function onSubscribeBoardClick(): Promise<void> {
		console.log('按下訂閱看板');
		try {
			unwrap(await API_FETCHER.userQuery.subscribeBoard(board.id));
			subscribe({
				id: board.id,
				board_name: board.board_name,
				board_type: board.board_type,
				title: board.title,
				popularity: 0
			});
		} catch (err) {
			toastErr(err);
		}
	}
	return {
		has_subscribed,
		toggleSubscribe: () => {
			return has_subscribed ? onUnsubscribeBoardClick() :onSubscribeBoardClick();
		}
	};
}

export function useBoard(board_id: number): Board | null {
	// TODO: 記憶
	const [board, setBoard] = React.useState<Board | null>(null);
	React.useEffect(() => {
		API_FETCHER.boardQuery.queryBoardById(board_id).then(res => {
			setBoard(unwrap(res));
		}).catch(err => {
			toastErr(err);
		});
	}, [board_id]);
	return board;
}

// 以返回的 value, onChange 綁定 input 的值
function useInputValue(initialValue: string = '', onChange: (s: string) => void = () => { }): {
	input_props: {
		value: string,
		onChange: (e: InputEvent) => void
	},
	setValue: React.Dispatch<React.SetStateAction<string>>,
} {
	const [value, setValue] = React.useState<string>(initialValue);
	return {
		input_props: {
			value: value,
			onChange: (event: InputEvent) => {
				let value = event.target.value;
				setValue(value);
				onChange(value);
			}
		},
		setValue,
	};
}

function useScrollBottom(): [React.RefObject<HTMLDivElement>, () => void] {
	const ref = React.useRef<HTMLDivElement>(null);
	function scrollToBottom(): void {
		if (ref != null && ref.current != null) {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
	}
	return [ref, scrollToBottom];
}

/**
 * 回傳兩個與頁面卷動相關的函式：
 * * `setEmitter` - 將 HTML 元素設定為卷動事件的發射器
 * * `useScrollToBottom` - 使組件得以監聽發射器的卷動到底事件
 */
function useScrollState(): {
	setEmitter: (emitter: HTMLElement | null) => void,
	useScrollToBottom: (handler: () => void) => void
	} {
	let [emitter, setEmitter] = React.useState<HTMLElement | null>(null);
	function useScrollToBottom(handler: () => void): void {
		React.useLayoutEffect(() => {
			let listener = (): void => {
				if (emitter) {
					let body = emitter;
					if (body.scrollHeight - (body.scrollTop + body.clientHeight) < 3) {
						handler();
					}
				}
			};
			if (emitter) {
				listener(); // 先執行一次再說
				emitter.addEventListener('scroll', listener);
				window.addEventListener('resize', listener);
			}
			return () => {
				if (emitter) {
					emitter.removeEventListener('scroll', listener);
					window.removeEventListener('resize', listener);
				}
			};
			// eslint-disable-next-line
		}, [emitter, handler]);
		// NOTE: 上面那行 linter 會報警告，但不加 emitter 可能會導致錯誤
	}
	return {
		setEmitter,
		useScrollToBottom
	};
}

function useMainScroll(): {
	useMainScrollToBottom: (handler: () => void) => void
	} {
	function useMainScrollToBottom(handler: () => void): void {
		React.useLayoutEffect(() => {
			let listener = (): void => {
				if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
					handler();
				}
			};
			window.addEventListener('scroll', listener);
			window.addEventListener('resize', listener);
			return () => {
				window.removeEventListener('scroll', listener);
				window.removeEventListener('resize', listener);
			};
		}, [handler]);
	}
	return {
		useMainScrollToBottom
	};
}

function useFocus(): [React.RefObject<HTMLInputElement>, () => void] {
	const input_ref = React.useRef<HTMLInputElement>(null);
	const setFocus = (): void => { input_ref.current && input_ref.current.focus(); };

	return [input_ref, setFocus];
}


export {
	useInputValue,
	useScrollBottom,
	useScrollState,
	useMainScroll,
	useFocus
};