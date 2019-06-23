import * as React from 'react';

type InputEvent = React.ChangeEvent<HTMLInputElement>;

// 以返回的 value, onChange 綁定 input 的值
function useInputValue(initialValue: string = ''): { value: string, onChange: (e: InputEvent) => void } {
	const [value, setValue] = React.useState<string>(initialValue);
	return {
		value: value,
		onChange: (event: InputEvent) => setValue(event.target.value)
	};
}

export {
	useInputValue
};