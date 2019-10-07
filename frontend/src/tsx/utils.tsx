import * as React from 'react';

type InputEvent = React.ChangeEvent<HTMLInputElement>;

// 以返回的 value, onChange 綁定 input 的值
function useInputValue(initialValue: string = ''): {
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
			onChange: (event: InputEvent) => setValue(event.target.value)
		},
		setValue,
	};
}

// 使被綁定的 div 能在更新時自動捲到底
function useScrollBottom(): React.RefObject<HTMLDivElement> {
	const ref = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (ref != null && ref.current != null) {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
	});
	return ref;
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
		}, [emitter, handler]);
		// NOTE: 上面那行 linter 會報警告，但不加 emitter 可能會導致錯誤
	}
	return {
		setEmitter,
		useScrollToBottom
	};
}

export {
	useInputValue,
	useScrollBottom,
	useScrollState
};
